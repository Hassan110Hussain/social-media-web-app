# Implementation Analysis: Feed Features

## Current Implementation Status

### ✅ What's Already Implemented

1. **Following Tab** (`fetchFollowingPosts`)
   - ✅ Correctly shows posts from users the current user follows
   - ✅ Excludes the current user's own posts
   - ✅ Properly ordered by `created_at` descending

2. **Basic Infrastructure**
   - ✅ Post fetching functions with proper error handling
   - ✅ User interaction tracking (likes, shares, saves, comments)
   - ✅ Following relationship management (`follows` table)
   - ✅ Frontend components for Home and Explore pages
   - ✅ Tab switching between "For You" and "Following"

### ❌ What Needs to be Implemented

1. **For You Tab** (`fetchForYouPosts`)
   - ❌ Currently: Shows user's own posts + posts from direct follows (1 level)
   - ✅ Required: Show posts from direct follows + posts from people those follows follow (2 levels deep)

2. **Explore Page** (`fetchExplorePosts`)
   - ❌ Currently: Shows all posts ordered by `created_at` DESC (newest first)
   - ✅ Required: Show all posts in **random order**

---

## Database Structure

Based on the code analysis:

- **`follows` table**: 
  - `follower_id` (user who follows)
  - `following_id` (user being followed)
  
- **`posts` table**:
  - `id`, `content`, `image_url`, `created_at`, `user_id`
  - Foreign key to `users` table

---

## Implementation Steps

### Step 1: Update `fetchForYouPosts` Function

**Location**: `src/data/dataForPosts/fetch.ts`

**Current Logic**:
```typescript
// Get direct follows
const followingIds = await getFollowingIds();
// Include current user
const userIdsToShow = [user.id, ...followingIds];
// Fetch posts from these users
```

**New Logic Needed**:
1. Get users the current user follows (direct follows)
2. For each direct follow, get who they follow (2nd level follows)
3. Combine: current user + direct follows + 2nd level follows
4. Fetch posts from all combined user IDs
5. Order by `created_at` DESC

**Implementation Approach**:
- Create a helper function `getSecondLevelFollowingIds()` in `src/lib/follows.ts`
- This function will:
  - Take the direct following IDs
  - Query `follows` table where `follower_id IN (directFollowingIds)`
  - Return the `following_id` values (2nd level follows)
- Update `fetchForYouPosts` to use this helper

### Step 2: Update `fetchExplorePosts` Function

**Location**: `src/data/dataForPosts/fetch.ts`

**Current Logic**:
```typescript
.order("created_at", { ascending: false });
```

**New Logic Needed**:
- Fetch all posts
- Randomize the order (either in database or in JavaScript)

**Implementation Approaches**:

**Option A: Database-level randomization (Recommended)**
- Use PostgreSQL's `ORDER BY RANDOM()`
- In Supabase, this can be done with a raw SQL query or using `.order()` with a custom function
- However, Supabase client doesn't directly support `RANDOM()`, so we might need:
  - A database function/view
  - Or client-side randomization

**Option B: Client-side randomization (Simpler)**
- Fetch all posts as currently done
- Shuffle the array in JavaScript after fetching
- Use Fisher-Yates shuffle algorithm for true randomization

**Recommendation**: Use Option B (client-side) for simplicity, unless you have performance concerns with large datasets.

---

## Detailed Implementation Plan

### Phase 1: Database/Backend Changes

#### 1.1 Add Helper Function for 2nd Level Follows

**File**: `src/lib/follows.ts`

Add new function:
```typescript
/**
 * Get list of user IDs that the users you follow are following (2nd level)
 * @param directFollowingIds - Array of user IDs that the current user directly follows
 * @returns Array of user IDs (2nd level follows)
 */
export async function getSecondLevelFollowingIds(directFollowingIds: string[]): Promise<string[]> {
  if (directFollowingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .in("follower_id", directFollowingIds);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set(data?.map((row) => row.following_id) ?? [])];
}
```

#### 1.2 Update `fetchForYouPosts` Function

**File**: `src/data/dataForPosts/fetch.ts`

**Changes**:
1. Import the new helper: `import { getFollowingIds, getSecondLevelFollowingIds } from "@/lib/follows";`
2. Update the function logic:
   ```typescript
   // Get direct follows
   const directFollowingIds = await getFollowingIds();
   
   // Get 2nd level follows (people that your follows follow)
   const secondLevelFollowingIds = await getSecondLevelFollowingIds(directFollowingIds);
   
   // Combine: current user + direct follows + 2nd level follows
   const userIdsToShow = [
     user.id,
     ...directFollowingIds,
     ...secondLevelFollowingIds
   ];
   
   // Remove duplicates
   const uniqueUserIds = [...new Set(userIdsToShow)];
   
   // Fetch posts from all these users
   // ... rest of the function
   ```

#### 1.3 Update `fetchExplorePosts` Function

**File**: `src/data/dataForPosts/fetch.ts`

**Changes**:
1. Remove the `.order("created_at", { ascending: false })` line
2. After fetching posts, shuffle the array:
   ```typescript
   // After fetching postsData and mapping
   const shuffledPosts = shuffleArray(mappedPosts);
   return shuffledPosts;
   ```

3. Add shuffle helper function at the top of the file:
   ```typescript
   /**
    * Fisher-Yates shuffle algorithm for randomizing array
    */
   function shuffleArray<T>(array: T[]): T[] {
     const shuffled = [...array];
     for (let i = shuffled.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }
     return shuffled;
   }
   ```

### Phase 2: Frontend Changes

**No frontend changes needed!** The components are already set up correctly:
- `Home/index.tsx` already calls `fetchForYouPosts()` and `fetchFollowingPosts()`
- `Explore/index.tsx` already calls `fetchExplorePosts()`

The changes are purely in the data fetching layer.

---

## Testing Checklist

After implementation, test:

1. **For You Tab**:
   - [ ] Shows your own posts
   - [ ] Shows posts from users you follow
   - [ ] Shows posts from users that your follows follow (2nd level)
   - [ ] No duplicate posts
   - [ ] Posts are ordered by newest first

2. **Following Tab**:
   - [ ] Shows only posts from users you follow
   - [ ] Does NOT show your own posts
   - [ ] Does NOT show 2nd level follows
   - [ ] Posts are ordered by newest first

3. **Explore Page**:
   - [ ] Shows all posts from all users
   - [ ] Posts are in random order (refresh page to verify different order)
   - [ ] All posts are visible (no missing posts)

---

## Performance Considerations

1. **For You Tab (2nd level follows)**:
   - If a user follows many people, and those people follow many others, this could result in a large query
   - Consider adding pagination if needed
   - The current implementation should handle moderate-sized datasets fine

2. **Explore Page (Randomization)**:
   - Client-side shuffling is fine for datasets up to ~10,000 posts
   - For larger datasets, consider:
     - Server-side randomization with pagination
     - Caching randomized results
     - Using database-level randomization with a stored procedure

---

## Summary

**Files to Modify**:
1. `src/lib/follows.ts` - Add `getSecondLevelFollowingIds()` function
2. `src/data/dataForPosts/fetch.ts` - Update `fetchForYouPosts()` and `fetchExplorePosts()`

**Files That Don't Need Changes**:
- `src/components/dashboard/Home/index.tsx` ✅
- `src/components/dashboard/Explore/index.tsx` ✅
- `src/lib/posts.ts` ✅ (just re-exports)

**Estimated Complexity**: Low to Medium
**Estimated Time**: 1-2 hours

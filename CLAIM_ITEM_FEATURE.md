# Claim Item Feature Implementation

## Overview
A complete claim item workflow for staff members to process lost item claims from users.

## Components Created

### 1. ClaimItem Component (`src/features/staff/pages/ClaimItem.tsx`)
A comprehensive page for processing item claims with the following features:

#### Key Features:
- **Post Display**: Shows the item being claimed using PostCard component
- **User Search**: Real-time search to find the claimer using email
  - Implements the same pattern as AddRole component using `useStaffSearch` hook
  - Debounced search with caching and min 2-character requirement
  - Shows dropdown results with user avatars, names, and emails
  
- **Selected Claimer Card**: Displays the selected user with ability to remove
  - Shows avatar, name, and email
  - Quick remove button for changing selection
  
- **Notification System**: Automatically notifies the poster when item is claimed
  - Only sends notification for "lost" item_type (not "found")
  - Message: "We found items similar to your reported lost item, you might want to come and check"
  - Uses `useNotifications` hook with proper parameters
  
- **Confirmation Modal**: Asks for confirmation before processing the claim
  - Shows different text based on item type (lost vs found)
  
- **HeaderWithButtons**: Navigation header with:
  - Cancel button: Navigate back to `/staff/post-records`
  - Submit button: Process the claim
  - Loading state during processing

#### Data Flow:
1. User clicks "Claim Item" in PostRecords page
2. Navigates to `/staff/post/claim/:postId`
3. Post is loaded using `getPost()` from posts data
4. Staff searches and selects the claimer
5. Confirms the claim
6. Notification sent to poster (if lost item type)
7. Toast message shown and user redirected back to post-records

## Route Configuration

### Added to StaffRoutes (`src/app/routes/StaffRoutes.tsx`):
```tsx
<Route
  exact
  path='/staff/post/claim/:postId'
  render={() => <ClaimItem />}
/>
```

## Navigation Integration

### Updated PostRecords (`src/features/staff/pages/PostRecords.tsx`):
Changed the "Claim Item" action sheet handler from placeholder to actual navigation:
```tsx
case 'claim':
  navigate(`/staff/post/claim/${id}`)
  break
```

## Dependencies Used

### Hooks:
- `useNavigation`: For page navigation
- `useStaffSearch`: For user search functionality (from admin hooks)
- `useNotifications`: For sending notifications to poster

### Components:
- `HeaderWithButtons`: Custom header with submit/cancel buttons
- `PostCard`: Display the item details
- `CardHeader`: Section header with icon
- `ConfirmationModal`: Confirmation before processing

### Data Functions:
- `getPost()`: Load post by ID from posts data
- `sendNotification()`: Send in-app notification to poster

## User Flow

1. **Staff Views Post Records** → Clicks kebab menu → Selects "Claim Item"
2. **ClaimItem Page Loads** → Shows the item details in a PostCard
3. **Search for Claimer** → Types email → Results dropdown appears
4. **Select Claimer** → Clicks user → Shows selected user card
5. **Confirm Claim** → Clicks submit → Confirmation modal shows
6. **Process** → Confirms → Notification sent to poster (if lost)
7. **Success** → Toast shows → Redirects to post-records

## Notification Details

### Condition:
- Only sent when `item_type === 'lost'`
- Skipped for "found" items

### Notification Parameters:
- **Recipient**: `post.user_id` (the original poster)
- **Title**: "Similar Items Found"
- **Message**: "We found items similar to your reported lost item, you might want to come and check"
- **Type**: "info"

## UI/UX Features

### Search Results:
- User avatar with fallback to default icon
- User name and email in dropdown
- Hover effect for better interactivity
- "No users found" message when search yields no results

### Selected User Card:
- Professional card design matching AddRole pattern
- User role badge showing "Claimer"
- Quick remove button (X icon)
- Proper spacing and typography

### Error Handling:
- Toast notifications for errors (e.g., no user selected)
- Loading states during processing
- Clear error messages

### Form Validation:
- Requires valid post ID in URL
- Requires claimer selection before submit
- Shows error toast if post not found

## Testing Checklist

- [ ] Navigate to claim item from post records
- [ ] Search for users by email
- [ ] Select and deselect users
- [ ] Confirm claim submission
- [ ] Verify notification sent to poster (lost items only)
- [ ] Verify redirect after success
- [ ] Test error cases (invalid post, no selection)
- [ ] Test back navigation from header cancel button

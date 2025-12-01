# Toast Messages

## Settings

### SettingsList.tsx

#### Cache Management
- `All caches cleared successfully`
- `Failed to clear caches`

#### Camera Permission
- `Camera permission granted`
- `Camera permission denied`
- `Camera permission request failed`
- `Please revoke camera permission in your device settings`

#### Notifications Permission
- `Notifications permission granted`
- `Notifications permission denied`
- `Notifications permission request failed`
- `Please revoke notifications permission in your device settings`

#### Permissions Sync
- `Permissions synced`

## Post Management

### PostList.tsx

#### Post Deletion
- `No internet connection - Cannot delete post`
- `Failed to delete post`
- `Post deleted successfully`

#### Status Changes
- `This post and item status was just changed a second ago, please wait a few seconds before changing it again`
- `Please select at least one status to change`
- `Failed to update post status` (or error message from server)
- `Failed to update item status` (or error message from server)
- `Status updated successfully`
- `Failed to apply status change`

#### Post Rejection
- `Please select a rejection reason`
- `Post rejected successfully`
- `Failed to reject post` (or error message from server)

#### Network/Cache
- `No internet connection - Showing cached posts`

#### Sharing
- `Share sheet opened`
- `Link copied to clipboard`
- `Shared post cancelled`
- `Failed to share post`

#### Item ID Copy
- `Item ID copied to clipboard`
- `Item ID not available`
- `Failed to copy Item ID`

#### Custom Toast (via onShowToast prop)
- Custom message passed from parent component

## Search

### User SearchItem.tsx / Staff SearchItem.tsx

#### Search Errors
- `Search failed. Please try again.` (or error message from server)

## User Pages

### Matches.tsx

#### Offline
- `Getting updated posts failed — not connected to the internet`

### Home.tsx

#### Offline
- `Getting updated posts failed — not connected to the internet`

### ExpandedHistoryPost.tsx

#### Loading Errors
- `Failed to load Post - No Internet Connection`

#### Post Deletion
- `Post deleted successfully`
- `Failed to delete post` (or error message from server)

### NewPost.tsx

#### AI Generation
- `Autogeneration is limited to 10 times per 5 minutes`
- AI generation error messages (from API)

#### Validation
- `Please fill in all required fields.`

#### Network
- `You are not connected to the internet`

#### Post Creation
- `Post created successfully!`
- `Failed to create post` (or error message from server)

### EditPost.tsx

#### Loading
- `Post not found`
- `Failed to fetch post data`

#### AI Generation
- `Autogeneration is limited to 10 times per 5 minutes`
- AI generation error messages (from API)

#### Validation
- `Please fill in all required fields.`

#### Network
- `You are not connected to the internet`

#### Post Update
- `Post updated successfully!` (or success message from server)
- `Failed to create post` (or error message from server)

## Staff Pages

### PostRecords.tsx

#### Network/Offline
- `Getting updated posts failed — not connected to the internet`
- `No internet connection - Showing cached posts`

#### Sharing
- `Link copied to clipboard`
- `Failed to share post`

#### Notifications
- `Post not found`
- `Owner notified successfully`
- `Failed to notify owner`

#### Item ID Copy
- `Item ID copied to clipboard`
- `Failed to copy Item ID`

### Home.tsx

#### Network/Offline
- `Offline. Showing cached posts`
- `Fetching posts failed`
- `No internet connection - Showing cached posts`
- `Failed to refresh posts`

### NewPost.tsx

#### AI Generation
- AI generation error messages (from API)

#### Validation
- `Please fill in all required fields.`

#### Authentication
- `User not authenticated`

#### Network
- `Failed to create new post - device not connected to the internet`

#### Post Creation
- `Post created successfully!`
- `Failed to create post` (or error message from server)

### ExpandedPostRecord.tsx

#### Loading Errors
- `Failed to load Post - No Internet Connection`
- `Post record not found`
- `Failed to load post record`

#### Sharing
- `Link copied to clipboard`
- `Failed to share post`

#### Notifications
- `Notification sent to owner successfully`
- `Failed to send notification to owner`

#### Status Changes
- `This post and item status was just changed a second ago, please wait a few seconds before changing it again`
- `Please select at least one status to change`
- `Failed to apply status change` (or error message from server)
- `Status updated successfully`

#### Post Rejection
- `Please select a rejection reason`
- `Post rejected successfully`
- `Failed to reject post` (or error message from server)

### FraudReports.tsx

#### Network/Offline
- `Getting updated reports failed — not connected to the internet`
- `Failed to refresh reports`

## Posts

### ReportPost.tsx

#### Validation
- `Please select a concern`
- `Please review and confirm the details`

#### Network
- `You are not connected to the internet`

#### Authentication
- `User not authenticated`

#### Duplicate Reports
- `You have already reported this item. Please wait for staff to review your previous report.`

#### Report Submission
- `Report submitted successfully!`
- `Failed to submit report`
- Error messages from server

### ExpandedPost.tsx

#### Loading Errors
- `Failed to load Post - No Internet Connection`

## Authentication

### Auth.tsx

#### Rate Limiting
- `Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before trying again.`

#### Access Denied
- `Access Denied. Please use your organization email to sign in.`

#### Login Errors
- `Login Failed. Authentication with Google was unsuccessful. Please try again.`
- `Login Failed. Authentication with Google was unsuccessful.`
- `Sign-in failed. Please use your organization email to sign in or try again at a different time`
- `Sign-in failed. Please try again.` (with error details)

## Admin Pages

### StaffManagement.tsx

#### Member Removal
- `Staff member removed successfully`
- `Admin removed successfully`
- `Failed to remove member. Please try again.`

### AddRole.tsx

#### User Selection
- `User already selected`

#### Role Assignment
- `Successfully added ${successCount} staff member${successCount > 1 ? 's' : ''}`
- `Added ${successCount} successfully, ${failedCount} failed.`
- `Failed to add staff members. Please try again.`
- Error messages from server
- `No users selected`

### GenerateAnnouncement.tsx

#### Validation
- `Title or Message must not be empty`

#### Announcement Creation
- Success/error messages from `generateAnnouncementAction`

## Staff - Claim Item

### ClaimItem.tsx

#### Validation
- `Invalid post ID`

#### Network/Loading
- `No internet connection. Please check your network.`
- `Post not found`
- `Failed to load post`

#### Contact Number Validation
- `Please enter a valid Philippine mobile number (examples: 09123456789, 0912 345 6789, +639123456789, +63 912-345-6789)`
- `Invalid contact number`

#### Item Verification
- `Referenced lost item not found. Please verify the Item ID.`
- `Referenced lost item not found`
- `Failed to verify post status`
- `Failed to verify linked lost item`
- `Cannot mark item as returned — it has already been returned.`

#### Claim Submission
- `Failed to claim item - no internet connection`
- Success messages from submit callback
- Error messages from submit callback

## Staff - Fraud Reports

### ExpandedFraudReport.tsx

#### Loading Errors
- `Failed to load Report - No Internet Connection`
- `Report not found`
- `Failed to load report`

#### Report Actions
- `Fraud report opened`
- `Failed to accept report`
- `Action failed`
- `Fraud report rejected successfully`
- `Failed to reject report`
- `Report closed successfully`
- `Failed to close report`
- `Report moved to under review`
- `Failed to review report`

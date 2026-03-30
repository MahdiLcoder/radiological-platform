# Plan: Dynamic Profile Images

## Problem
Profile images are hardcoded URLs in 3 frontend components (sidebar, header, edit-profile). The backend `User` model has no `profile_image` field and no upload endpoint exists.

## Solution
Add `profile_image` URL field to User model, create a Cloudinary upload endpoint, and bind all 3 components to the dynamic image.

---

## Backend Changes

### 1. Add `profile_image` field to User model
**File:** `backend/accounts/models.py`
- Add `profile_image = models.URLField(blank=True, null=True)` to the `User` class

### 2. Run migration
```bash
cd backend && python manage.py makemigrations && python manage.py migrate
```

### 3. Add `profile_image` to serializers
**File:** `backend/accounts/serializers.py`
- Add `'profile_image'` to `fields` list in both `RegisterSerializer.Meta` and `UserSerializer.Meta`
- Add `profile_image = serializers.URLField(required=False, allow_null=True, allow_blank=True)` to `UserSerializer`

### 4. Add profile image upload endpoint
**File:** `backend/accounts/views.py`
- Create `ProfileImageUploadView(APIView)`:
  - POST: accepts multipart form with `image` field
  - Validates file extension (jpg, jpeg, png)
  - Uploads to Cloudinary under `profile_images/<user_id>/` folder
  - Updates `request.user.profile_image` with the returned secure URL
  - Returns `{"profile_image": "<url>"}`
  - Permission: `IsAuthenticated`

**File:** `backend/accounts/urls.py`
- Add `path('me/upload-image/', ProfileImageUploadView.as_view())`

---

## Frontend Changes

### 5. Add `profile_image` to TypeScript types
**File:** `frontend/src/app/types/chat.ts`
- Add `profile_image?: string;` to the `User` interface

**File:** `frontend/src/app/components/header/header.ts`
- Add `profile_image?: string;` to the `UserProfile` interface

### 6. Add upload method to AuthService
**File:** `frontend/src/app/services/authService.ts`
- Add `uploadProfileImage(file: File)` method:
  - Creates `FormData` with the image file
  - POSTs to `/api/auth/me/upload-image/`
  - Returns `Observable` with the response

### 7. Update sidebar avatar (line 37)
**File:** `frontend/src/app/components/sidebar/sidebar.html`
- Replace hardcoded Unsplash URL with `[src]="profile.profile_image || fallbackUrl"`
- Define a CSS gradient or placeholder SVG as fallback

### 8. Update header avatar (line 43)
**File:** `frontend/src/app/components/header/header.html`
- Replace hardcoded Google CDN URL with `[src]="profile.profile_image || fallbackUrl"`

### 9. Update edit-profile avatar + add upload
**File:** `frontend/src/app/pages/edit-profile/edit-profile.ts`
- Add `uploadImageMutation` using `injectMutation`
- Add `onFileSelected(event: Event)` handler that:
  - Extracts file from input
  - Calls upload mutation
  - On success: invalidates `['profile']` query
  - Shows success/error message

**File:** `frontend/src/app/pages/edit-profile/edit-profile.html`
- Add hidden `<input #fileInput type="file" accept="image/*">` 
- Make the existing edit overlay `(click)="fileInput.click()"`
- Bind `<img [src]="profile.profile_image || fallbackUrl">`
- Show upload progress state via `uploadImageMutation.isPending()`

---

## Files Modified (11 total)

| # | File | Change |
|---|------|--------|
| 1 | `backend/accounts/models.py` | Add `profile_image` URLField to User |
| 2 | `backend/accounts/serializers.py` | Include `profile_image` in both serializers |
| 3 | `backend/accounts/views.py` | Add `ProfileImageUploadView` with Cloudinary upload |
| 4 | `backend/accounts/urls.py` | Add `me/upload-image/` URL |
| 5 | `frontend/src/app/types/chat.ts` | Add `profile_image` to User interface |
| 6 | `frontend/src/app/components/header/header.ts` | Add `profile_image` to UserProfile interface |
| 7 | `frontend/src/app/services/authService.ts` | Add `uploadProfileImage()` method |
| 8 | `frontend/src/app/components/sidebar/sidebar.html` | Dynamic `[src]` for avatar |
| 9 | `frontend/src/app/components/header/header.html` | Dynamic `[src]` for avatar |
| 10 | `frontend/src/app/pages/edit-profile/edit-profile.ts` | Upload mutation + file handler |
| 11 | `frontend/src/app/pages/edit-profile/edit-profile.html` | Dynamic image + file input trigger |

## Verification
1. Run backend migrations successfully
2. Test POST `/api/auth/me/upload-image/` with an image file via curl/Postman
3. Verify GET `/api/auth/me/` returns `profile_image` field (null or URL)
4. Verify sidebar, header, and edit-profile show uploaded image or fallback initial
5. Upload a new image from edit-profile and confirm it updates everywhere after refresh

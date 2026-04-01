# Member 3 — Gym Discovery, Map & Reviews (Full-stack)

[← Task Distribution](../task_distribution.md) · [← README](../../README.md)

---

## Role

You own everything gym-related — from the PostGIS database to the interactive map with pins. This is the most **visually interactive** module and gives the app its "wow factor" during the live demo.

---

## Sprint 0 — Days 1–4

- [ ] **Gym database models** (while waiting for M1's DB setup)
  - Design `Gym` model: id, name, address, location (PostGIS `POINT`), opening_hours (JSON), equipment (JSON array), pricing_plans (JSON), image_url, avg_rating
  - Design `GymReview` model: id, user_id (FK), gym_id (FK), rating (1–5), content (text), image_urls (JSON array), created_at
  - Design `FavoriteGym` model: id, user_id (FK), gym_id (FK), created_at
  - Write Alembic migration for all 3 tables

- [ ] **Seed data**
  - Create a seed script with 15–20 gyms from Bucharest (realistic names, real coordinates, plausible data)
  - Include varied equipment lists, price ranges, and ratings
  - Script runs with: `python scripts/seed_gyms.py`

---

## Sprint 1

### Backend

- [ ] **Nearby gyms endpoint**
  - `GET /api/gyms/nearby?lat=44.4268&lng=26.1025&radius=5000`
  - Use PostGIS `ST_DWithin` for distance filtering
  - Return: list of gyms with distance, sorted by proximity
  - Pagination: `?page=1&limit=20`

- [ ] **Gym detail endpoint**
  - `GET /api/gyms/{id}` — full gym info + average rating + review count

- [ ] **Gym recommendations**
  - `GET /api/gyms/recommend?budget=200&equipment=squat_rack,treadmill&max_distance=3000`
  - Scoring algorithm: weighted sum of (price match + equipment match + distance + rating)
  - Return top 5 matches with score

### Frontend

- [ ] **Map screen**
  - Install `react-native-maps` + `expo-location`
  - Request location permission on first load
  - Center map on user's current location
  - Call `/api/gyms/nearby` and render pins for each gym
  - Cluster pins when zoomed out (use `react-native-map-clustering`)

---

## Sprint 2

### Backend

- [ ] **Reviews CRUD**
  - `POST /api/gyms/{id}/reviews` — create review (rating + text + images)
  - `GET /api/gyms/{id}/reviews?page=1` — paginated list
  - Recalculate `avg_rating` on gym after each new review

- [ ] **Favorites CRUD**
  - `POST /api/users/me/favorite-gyms/{gym_id}` — add to favorites
  - `DELETE /api/users/me/favorite-gyms/{gym_id}` — remove
  - `GET /api/users/me/favorite-gyms` — list with gym details

- [ ] **Image upload**
  - `POST /api/upload/image` — accepts image file, stores locally or Cloudinary
  - Returns URL to be saved in review

### Frontend

- [ ] **Gym detail screen**
  - Bottom sheet or full screen on pin tap
  - Sections: header with name + image, info (hours, equipment, address), pricing, rating + review count
  - "Add to Favorites" toggle button (heart icon)
  - Reviews section with list + "Write a Review" button

- [ ] **Favorites screen**
  - List of favorited gyms (card layout)
  - Tap → navigate to gym detail
  - Swipe to remove from favorites

- [ ] **Review form**
  - Star rating selector (1–5)
  - Text input for review content
  - Image picker (gallery + camera) via `expo-image-picker`
  - Submit → `POST /api/gyms/{id}/reviews`

---

## Sprint 3

- [ ] **Polish & extras**
  - Map filter controls: filter by equipment, price range, rating
  - Search bar on map screen (search gym by name)
  - Smooth bottom sheet animation for gym details
  - Handle edge cases: no location permission, no gyms found, empty reviews

- [ ] **Tests**
  - Backend: test nearby endpoint with different coordinates and radii
  - Backend: test review creation and avg_rating recalculation
  - Frontend: test map renders pins from mock data

---

## Key Files You Own

```
backend/app/
├── routers/gyms.py
├── services/gym_service.py
├── models/gym.py
└── schemas/gym.py

backend/scripts/
└── seed_gyms.py

frontend/src/
├── screens/
│   ├── map/MapScreen.tsx
│   ├── gym/GymDetailScreen.tsx
│   ├── gym/FavoritesScreen.tsx
│   └── gym/WriteReviewScreen.tsx
└── components/gym/
    ├── GymCard.tsx
    ├── GymPin.tsx
    ├── ReviewCard.tsx
    └── StarRating.tsx
```

---

## User Stories Covered

- US-01: Map with nearby gyms
- US-02: Gym details on click
- US-03: Gym recommendations
- US-13: Favorites
- US-14: Reviews with pictures

---

## Definition of Done

- [ ] Map shows pins for nearby gyms based on GPS
- [ ] Tapping a pin shows gym details
- [ ] Can add/remove gyms from favorites
- [ ] Can write a review with rating + text + image
- [ ] Recommendation endpoint returns sensible results
- [ ] Minimum 5 commits with meaningful messages

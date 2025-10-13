# HomeModern QA Checklist

Manual verification steps to validate the modern GPS dashboard experience across desktop and mobile breakpoints:

## Desktop (≥1024px)
- Open `/gps/modern` and confirm the summary bar renders vehicle totals, online/moving counts, active alerts, and route distance once data loads.
- Toggle the side drawer via the chevron button and confirm it collapses/expands without affecting the map state.
- Select a vehicle from the drawer list and verify the map centers on the vehicle, route playback controls become available, and historical route data can be scrubbed via the existing Route Panel.
- Use the refresh action in the summary bar to confirm vehicle data reloads (polling the `gpsService` hook).
- Trigger the alerts drawer from the summary bar, review alert metadata, acknowledge an alert, and ensure it is refreshed via the `SpeedingAlertsController` endpoint.
- Switch back to the legacy experience with the summary action and ensure routing updates to `/gps`.

## Mobile / Tablet (<1024px)
- Confirm the feature toggle in the sidebar persists the selected GPS view in local storage and routes to `/gps/modern`.
- Validate swipe gestures on the vehicle carousel: swiping left/right updates the active vehicle and selects it on the map.
- Verify the drawer slides over the map when expanded, and the “Show/Hide drawer” control in the summary bar responds appropriately.
- Acknowledge alerts from the drawer and confirm the drawer can be dismissed by tapping the backdrop.
- Test map pinch/zoom and drag to ensure `useMobileResponsive` maintains full-screen height without locking scroll.

## API/Command coverage
- Observe the network panel to ensure vehicle refreshes hit the `gpsService` endpoints and alert acknowledgements invoke `PUT /SpeedingAlerts/{id}/acknowledge`.
- Validate ignition state indicators on cards stay synchronized with live updates from `gpsService.getVehicleLatestPosition`.
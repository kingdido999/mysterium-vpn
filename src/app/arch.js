
// bootstrap()
// 1. check terms
// 2. create window
// 3. setup IPC send method
// 4. set current identity for (bugreporter/eventtracker)
// 5. start registration fetcher
// 6. bug reporter metrics start sync, set boot time
// 7. await on renderer loaded
// 8. if show terms ? resize window : quit
// 9. build tray
// 10. ensure daemon installation
// 11. start process
// 12. start process monitoring
// 13. on process ready, notify renderer
// 14. subscribe proposals
// 15. if payments enabled, sync registration status
// 16. sync favorites
// 17. sync disconnect notification settings
// 18. show notification on disconnect
// 19. await load user settings
// 20. on disconnect notification send reconnect request


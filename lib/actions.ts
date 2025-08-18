export const playNotificationSound = () => {
  const audio = new Audio("/notification-18-270129.mp3");
  if (audio) {
    audio!.play().catch((error) => {
      console.error("Failed to play sound:", error);
    });
  }
};

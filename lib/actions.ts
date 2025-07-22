

export const playNotificationSound = () => {
    const audio=new Audio('/iphone.mp3')
    if (audio) {
      audio!.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }
  };
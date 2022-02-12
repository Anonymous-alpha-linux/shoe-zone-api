class Subject {
    constructor(observers) {
        this.notifications = Array.from(observers);
    }
    registerObserver(observer) {
        this.notifications.push(observer);
    }
    removeObserver(index) {
        this.notifications.slice(index, 1);
    }
    notifyObserver(notify) {
        this.notifications.forEach(observer => {
            observer.receiveNotify();
        })
    }
}

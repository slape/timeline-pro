export const saveSettings = (settings) => {
    monday.storage.instance.setItem('settings', settings).then(res => {
        console.log(res);
       });
}

export const loadSettings = (setSettings) => {
    monday.storage.instance.getItem('settings').then(res => {
        setSettings(res);
       });
    }
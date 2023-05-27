window.application = {
    blocks: {},
    screens: {},
    renderScreen: function (screenName) {
        if (!(screenName in this.screens)) {
            alert("Такого Скрина нет!");
            return;
        }
        this.timers.forEach(timer => {
            clearInterval(timer);
            this.timers.pop();
        });
        this.screens[screenName]();

    },
    renderBlock: function (blockName, container) {
        if (!(blockName in this.blocks)) {
            alert("Такого блока нет");
            return;
        }
        this.blocks[blockName](container);
    },
    timers: [],
    isLoading: false
};
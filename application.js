window.application = {
    blocks: {},
    screens: {},
    renderScreen: function (screenName) {
        this.timers.forEach(timer => {
            clearInterval(timer);
            this.timers.pop();
        });
        if (!(screenName in this.screens)) {
            alert("Такова Скрина нет!");
            return;
        }
        this.screens[screenName]();

    },
    renderBlock: function (blockName, container) {
        if (!(blockName in this.blocks)) {
            alert("Такова блока нет");
            return;
        }
        this.blocks[blockName](container);
    },
    timers: []
};
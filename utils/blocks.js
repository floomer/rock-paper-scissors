function renderLoginBlock(container) {
    const inputField = document.createElement("input");
    const loginButton = document.createElement("button");
    const welcomeText = document.createElement("span");

    welcomeText.className = "welcomeText";
    welcomeText.textContent = "Добро пожаловать в игру, buddy!";
    inputField.className = "loginInputField";
    inputField.placeholder = "Введи своё имя";
    loginButton.className = "loginButtonSubmit";
    loginButton.textContent = "Войти в игру";

    container.appendChild(welcomeText);
    container.appendChild(inputField);
    container.appendChild(loginButton);

    container.onsubmit = (e) => {
        e.preventDefault();
        window.application.isLoading = true;
        window.application.renderScreen("blurScreen");
        const userLogin = inputField.value;
        request("/login", {login: userLogin}, tokenResponse => {
            if (tokenResponse.status !== "ok") {
                alert("Something went wrong!");
                return;
            }
            window.application.token = tokenResponse.token;
            request("/player-status", {token: tokenResponse.token}, statusResponse => {
                if (statusResponse.status !== "ok") {
                    return;
                }
                if (statusResponse["player-status"].status === "lobby") {
                    window.application.renderScreen("lobbyScreen");
                }
                if (statusResponse["player-status"].status === "game") {
                    window.application.matchId = statusResponse["player-status"].game.id;
                    window.application.renderScreen("gameMoveScreen");
                }
            });
        });
    };
}

function renderLobbyBlock(container) {
    const playersList = document.createElement("ol");
    const playersBlock_text = document.createElement("span");

    playersBlock_text.className = "playersBlock-text";
    playersBlock_text.textContent = "Игроки онлайн:";
    playersList.className = "playersList";

    container.appendChild(playersBlock_text);
    playersBlock_text.after(playersList);

    let requestPlayerStatus = () => request("/player-list", {token: window.application.token}, createPlayerList);
    requestPlayerStatus();
    let updatePlayerStatus = setInterval(requestPlayerStatus, 1000);

    function createPlayerList(response) {
        if (playersList.lastChild !== null && response.list.length <= playersList.childElementCount) {
            return;
        }
        playersList.childNodes.forEach(name => { //TODO: I should rework this
            name.remove();
        });
        response.list.forEach(player => {
            const playerElement = document.createElement("li");
            playerElement.innerHTML = player.login;
            if (player.you) {
                playerElement.innerHTML += "(Вы)";
            }
            playersList.append(playerElement);
        });
    }

    window.application.timers.push(updatePlayerStatus);
}

function renderPlayButtonBlock(container) {
    const playButton = document.createElement("button");
    const startGameText = document.createElement("span");

    playButton.className = "submitPlay";
    startGameText.className = "startGameText";
    startGameText.textContent = "Начать игру";

    container.appendChild(startGameText);
    container.appendChild(playButton);

    playButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.application.isLoading = true;
        window.application.renderScreen("blurScreen");
        request("/start", {token: window.application.token}, gameStart => {
            window.application.matchId = gameStart["player-status"].game.id;
        });
        window.application.renderScreen("waitingScreen");
    });
}

function renderWaitingBlock(container) {
    const waitingBlockText = document.createElement("span");
    const throbber = document.createElement("div");

    waitingBlockText.className = "waitingBlockText";
    throbber.className = "animated-ring";
    waitingBlockText.textContent = "Ожидаем соперника...";

    container.appendChild(waitingBlockText);
    container.appendChild(throbber);

    let requestGameStatus = setInterval(() =>
        request("/game-status",
            {
                token: window.application.token,
                id: window.application.matchId
            },
            getGameStatus), 1000);

    function getGameStatus(response) {
        if (response.status !== "ok") {
            return;
        }
        if (response["game-status"].status === "waiting-for-start") {
            return;
        }
        window.application.renderScreen("gameMoveScreen");
    }

    window.application.timers.push(requestGameStatus);
}

const gameBlockButtonArray = [
    {
        className: "gameButtons",
        elementName: "button",
        id: "rockButton",
        textContent: "",
        value: "rock"
    },
    {
        className: "gameButtons",
        elementName: "button",
        id: "scissorsButton",
        textContent: "",
        value: "scissors"
    },
    {
        className: "gameButtons",
        elementName: "button",
        id: "paperButton",
        textContent: "",
        value: "paper"
    }
];

function renderGameMoveBlock(container) {
    const moveBlock = document.querySelector(".moveBlock");
    const enemyName = document.createElement("span");
    request("/game-status", {
        token: window.application.token,
        id: window.application.matchId
    }, response => {
        const name = response["game-status"].enemy.login;
        enemyName.className = "gameEnemy";
        enemyName.textContent = "Ваш противник: " + name;
        container.prepend(enemyName);
    });
    const moveBlockText = document.createElement("span");
    moveBlockText.className = "moveText";
    moveBlockText.textContent = "Сделайте Ваш ход";
    container.prepend(moveBlockText);

    gameBlockButtonArray.forEach(button => {
        const documentElement = document.createElement(button.elementName);
        documentElement.className = button.className;
        documentElement.textContent = button.textContent;
        documentElement.value = button.value;
        documentElement.id = button.id;
        moveBlock.appendChild(documentElement);
    });
    const gameButtons = document.querySelectorAll(".gameButtons");
    gameButtons.forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            window.application.isLoading = true;
            window.application.renderScreen("blurScreen");
            let playerChoice = button.value;
            request("/play", {
                token: window.application.token,
                id: window.application.matchId,
                move: playerChoice
            }, response => {
                switch (response["game-status"].status) {
                    case "waiting-for-enemy-move":
                        window.application.renderScreen("waitingEnemyMoveScreen");
                        break;
                    case "waiting-for-your-move":
                        alert("С противником случилась ничья. Ходите снова.");
                        break;
                    case "lose":
                        window.application.renderScreen("loseScreen");
                        break;
                    case "win":
                        window.application.renderScreen("winScreen");
                        break;
                }
            });
        };
    });
}

function renderWaitingEnemyMoveBlock(container) {
    const waitingText = document.createElement("span");
    const throbber = document.createElement("div");

    waitingText.className = "waitingBlock-text";
    waitingText.textContent = "Ждём хода соперника..";
    throbber.className = "animated-ring";

    container.appendChild(waitingText);
    container.appendChild(throbber);

    let waitingEnemy = setInterval(() => request("/game-status", {
        token: window.application.token,
        id: window.application.matchId
    }, response => {
        if (response["game-status"].status === "lose") {
            window.application.renderScreen("loseScreen");
        }
        if (response["game-status"].status === "win") {
            window.application.renderScreen("winScreen");
        }
        if (response["game-status"].status === "waiting-for-your-move") {
            window.application.renderScreen("gameMoveScreen");
        }
    }), 1000);
    window.application.timers.push(waitingEnemy);
}

function renderWinBlock(container) {
    const winText = document.createElement("span");
    const returnButtonsBlock = document.createElement("div");
    const startGameBlock = document.createElement("div");

    startGameBlock.className = "startNewGame";
    returnButtonsBlock.className = "returnButtonsBlock";
    winText.className = "winBlock-text";
    winText.textContent = "Мои поздравления, Вы выиграли!";

    container.appendChild(winText);
    container.appendChild(returnButtonsBlock);
    returnButtonsBlock.appendChild(startGameBlock);

    window.application.renderBlock("returnToLobbyBlock", returnButtonsBlock);
    window.application.renderBlock("playButtonBlock", startGameBlock);
}

function renderLoseBlock(container) {
    const loseText = document.createElement("span");
    const returnButtonsBlock = document.createElement("div");
    const startGameBlock = document.createElement("div");

    startGameBlock.className = "startNewGame";
    returnButtonsBlock.className = "returnButtonsBlock";
    loseText.className = "loseBlock-text";
    loseText.textContent = "К сожалению, Вы проиграли...";

    container.appendChild(loseText);
    container.appendChild(returnButtonsBlock);
    returnButtonsBlock.appendChild(startGameBlock);

    window.application.renderBlock("returnToLobbyBlock", returnButtonsBlock);
    window.application.renderBlock("playButtonBlock", startGameBlock);
}

function renderReturnToLobbyBlock(container) {
    const returnToLobbyBlock = document.createElement("div");
    const returnToLobby = document.createElement("button");
    const returnToLobbyText = document.createElement("span");

    returnToLobbyBlock.className = "returnLobby";
    returnToLobbyText.className = "returnToLobbyText";
    returnToLobbyText.textContent = "Вернуться в лобби";
    returnToLobby.className = "returnLobbyButton";

    container.appendChild(returnToLobbyBlock);
    returnToLobbyBlock.appendChild(returnToLobbyText);
    returnToLobbyBlock.appendChild(returnToLobby);

    returnToLobby.onclick = (e) => {
        e.preventDefault();
        window.application.isLoading = true;
        window.application.renderScreen("blurScreen");
        window.application.renderScreen("lobbyScreen");
    };
}

window.application.blocks["loginBlock"] = renderLoginBlock;
window.application.blocks["lobbyBlock"] = renderLobbyBlock;
window.application.blocks["playButtonBlock"] = renderPlayButtonBlock;
window.application.blocks["waitingBlock"] = renderWaitingBlock;
window.application.blocks["gameMoveBlock"] = renderGameMoveBlock;
window.application.blocks["waitingEnemyMoveBlock"] = renderWaitingEnemyMoveBlock;
window.application.blocks["winBlock"] = renderWinBlock;
window.application.blocks["loseBlock"] = renderLoseBlock;
window.application.blocks["returnToLobbyBlock"] = renderReturnToLobbyBlock;

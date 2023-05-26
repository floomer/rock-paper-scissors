function request(endpoint, params, callback) {
    const backendUrl = "https://rps-zonest64.b4a.run" + endpoint;
    const xhr = new XMLHttpRequest();
    let url = new URL(backendUrl);
    url.search = (new URLSearchParams(params)).toString();
    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
    xhr.onload = () => {
        if (xhr.status === 200) {
            callback(xhr.response);
        }
    };
}

window.application.renderScreen("loginScreen");
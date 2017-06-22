function fetch(path, token, success, failure){
  const request = new XMLHttpRequest();
  const fullPath = `https://api.github.com/${path}`;
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      if (request.status === 200) {
        success(request.response);
      } else {
        failure(request.response);
      }
    }
  };

  request.open("GET", fullPath, true);
  request.setRequestHeader("Authorization", `token ${token}`);
  request.send(null);
}

window.onload = function(){

  let storedToken = null;
  let knownUser = {};
  const knownUserIcon = document.getElementById('icon');
  const knownUserUsername = document.getElementById('username');
  const knownUserLogin = document.getElementById('login');

  chrome.storage.local.get(null, (result) => {
    if (result.token !== undefined )
    {
      storedToken = result.token;
      fetch('user', storedToken, (response) => {
        knownUser = JSON.parse(response);

        knownUserIcon.src = `${knownUser.avatar_url}&s=40`;
        knownUserUsername.innerHTML = knownUser.name;
        knownUserLogin.innerHTML = knownUser.login;
      }, () => {
        knownUserIcon.src = 'assets/unknown.svg';
        knownUserUsername.innerHTML = 'O.o';
        knownUserLogin.innerHTML = 'Token seems invalid';
      } );
    } else {
      knownUserIcon.src = 'assets/unknown.svg';
      knownUserUsername.innerHTML = 'O.o';
      knownUserLogin.innerHTML = 'No token provided';
    }

    (document.getElementById('submit')).onclick = function(){
      chrome.storage.local.set({'token': document.getElementById('token').value});
    };
  });
};

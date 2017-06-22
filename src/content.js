(function () {
  'use strict';

  let user = {};
  let token = null;
  let currentHref = null;
  let retry = false;
  let repo = null;
  let owner = null;

  const states = {
    approved: '<svg aria-hidden="true" class="text-green octicon octicon-check" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5z"></path></svg>',
    changes_requested: '<svg aria-hidden="true" class="text-red octicon octicon-x" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z"></path></svg>'
  };

  chrome.storage.local.get(null, function(result) {
    token = result.token;
    fetchUser();
    //now that we have a token, let's start digging
    setInterval(analyseHref, 100);
  });

  function analyseHref() {
    const href = window.location.href;
    if (currentHref === href && !retry) {
      return null;
    }

    currentHref = href;
    const info = href.split('/');
    if (!/^pulls/.test(info[5])) {
      return null;
    }

    owner = info[3];
    repo = info[4];

    retry = false;
    fetchRepoPR();
  }

  function fetchUser() {
    fetch('user', token, (response) => {
      user = JSON.parse(response);
    }, () => console.warn(response))
  }

  function fetchRepoPR() {
    const path = `repos/${owner}/${repo}/pulls`;
    fetch(path, token, (response) => {
      const PR = JSON.parse(response);
      if (PR.length === 0) {
        retry = true;
      }
      PR.forEach((pull) => {
        fetchPRInfo(pull.number);
      });
    }, () => retry = true);
  }

  function fetchPRInfo(num) {
    const path = `repos/${owner}/${repo}/pulls/${num}/reviews`;
    fetch(path, token, (response) => {handleReviews(response, num);}, () => retry = true);
  }

  function handleReviews(reviews, num) {
    const reviewsObject = JSON.parse(reviews);
    reviewsObject.forEach(review => {
      if (review.state === 'COMMENTED') {
        return null;
      }
      const indic = document.getElementById(`issue_${num}`).getElementsByClassName('mt-1')[0];
      const el = document.createElement('span');
      const sep = '• ';

      let content =  `${review.user.login} ${states[review.state.toLowerCase()]}`;

      if (review.user.id === user.id) {
        el.innerHTML = `${sep}<b>${content}</b> `;
      } else {
        el.innerHTML = `${sep}${content} `;
      }

      indic.appendChild(el);
    });
  }

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
})();

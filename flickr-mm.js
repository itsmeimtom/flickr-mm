const flickrAPIKey = '&api_key=103c346803ab76aec72fd83b612e8666';
let mm = [];
let mm35 = [];

document.getElementById('usernameInput').onkeydown = function(e){
   if(e.keyCode == 13){
     getFlickrID(document.getElementById('usernameInput').value);
   }
}

function statusMsg(message) {
  document.getElementById('usernameInput').style['text-align'] = 'left';
  document.getElementById('usernameInput').value = '';
  document.getElementById('usernameInput').placeholder = message;
}

function getFlickrID(username) {
  if(!username) {
    statusMsg('Please Enter a Username!');
    return;
  }

  if(username.includes('@')) {
    statusMsg('NSID Detected, Skipping Username Check');
    startProcess(username, true);
    return;
  }

  statusMsg('Loading [looking up username]');

  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.people.findByUsername${flickrAPIKey}&username={{USERNAME}}&format=json&jsoncallback=startProcess`.replace('{{USERNAME}}',username);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

function startProcess(flickrData, isNSID) {
    if(isNSID) {
      loadUser(flickrData);
    } else {
      let j = flickrData;

      if(!j.user) {
        statusMsg('User Not Found!');
      } else {
        loadUser(j.user.nsid);
      }
    }
}

function loadUser(userID) {
  statusMsg('Loading [getting photos]');
  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos${flickrAPIKey}&user_id={{USERID}}&page=1&per_page=500&format=json&jsoncallback=loadPhotos&extras=o_dims`.replace('{{USERID}}',userID);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

let photoCount = 0;
function loadPhotos(flickrData) {
  statusMsg('Loading [loading photos]');
  let photos = flickrData.photos.photo;

  for(const photo of photos) {
    statusMsg(`Loading [loading photo #${photoCount}]`);
    let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.photos.getExif${flickrAPIKey}&photo_id={{PHOTOID}}&page=1&per_page=1&format=json&jsoncallback=addPhoto&extras=o_dims`.replace('{{PHOTOID}}', photo.id);

    let flickrScript = document.createElement('script');
    flickrScript.src = flickrURL;
    document.body.appendChild(flickrScript);
    flickrScript.parentNode.removeChild(flickrScript);

    photoCount++;
  }
}

let addedPhotos = 0;
function addPhoto(flickrData) {
statusMsg(`Loading [adding photo #${addedPhotos}]`);

  if(!flickrData.photo.exif) return;

  let exif = flickrData.photo.exif;
  for (const element of exif) {
    if(element.tag == 'FocalLengthIn35mmFormat') {
      mm35.push(parseInt(element.raw._content))
    } else if (element.tag == 'FocalLength') {
      mm.push(parseInt(element.raw._content))
    } else {
      continue;
    }
  }
  addedPhotos++;

  if(addedPhotos >= photoCount) {
    doneEverything();
  }
}

function doneEverything() {
  statusMsg(`Loading [done! calculating averages]`);

  let mmTtl = 0;
  for(const photo of mm) {
    mmTtl += photo;
  }
  let mmAvg = mmTtl / mm.length;


  let mm35Ttl = 0;
  for(const photo of mm35) {
    mm35Ttl += photo;
  }
  let mm35Avg = mm35Ttl / mm35.length;

  let mm35string = '';
  if(mm35Avg) {
    mm35string = `<h2>${parseInt(mm35Avg)}mm <span style="font-size: 0.8em; opacity: 0.8;">&mdash; 35mm equivalent</span><h2>`
  }

  statusMsg(`Loading [done!]`);
  document.getElementById('stuff').innerHTML = `
    <h1><span style="opacity: 0.5;">~</span>${parseInt(mmAvg)}mm</h1>
    ${mm35string}
  `;
}

// I wanted to see if I could figure out something *without* making any requests from within this JS file (no AJAX, no JQuery, etc), which is why it is the way it is (adding and deleting script files while being riddled with confusing callback functions)
// Sorry about that, but it does work, so I'm not complaining, even if you think it's messy!

const flickrAPIKey = '&api_key=103c346803ab76aec72fd83b612e8666'; // pls don't be lazy and just get your own
let mm = []; // array of all the photo focal lengths
let mm35 = []; // array of all the photo focal lengths but of flickr's 35mm converted instead

// start the whole thing off when someone presses enter in the input
document.getElementById('usernameInput').onkeydown = function(e) {
   if(e.keyCode == 13){
     getFlickrID(document.getElementById('usernameInput').value);
   }
}

// Updates on the loading progress are shown in the input
function statusMsg(message) {
  document.getElementById('usernameInput').style['text-align'] = 'left';
  document.getElementById('usernameInput').value = '';
  document.getElementById('usernameInput').placeholder = message;
}

// This gets the ID from a Flickr photostream URL (not as username as the input suggests)
// The script it inserts runs startProcess
function getFlickrID(username) {
  if(!username) {
    statusMsg('Please Enter a Photostream URL!');
    return;
  }

  statusMsg('Loading [looking up your URL]');

  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.urls.lookupUser${flickrAPIKey}&url={{USERNAME}}&format=json&jsoncallback=startProcess`.replace('{{USERNAME}}',username);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

// This confirms whether the user exists or not before starting the actual things
// It runs loadUser if the user exists
function startProcess(flickrData) {
    let j = flickrData;

    if(!j.user) {
      statusMsg('User Not Found!');
    } else {
      loadUser(j.user.id);
    }
}

// This doesn't load the user, rather loads the user's photos
// The script it inserts runs loadPhoots
function loadUser(userID) {
  statusMsg('Loading [getting photos]');
  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos${flickrAPIKey}&user_id={{USERID}}&page=1&per_page=500&format=json&jsoncallback=loadPhotos&extras=o_dims`.replace('{{USERID}}',userID);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

let photoCount = 0; // The number of photos returned from the people.getPublicPhotos script (max 500 most recent - can't be bothered to go over multiple pages)
function loadPhotos(flickrData) {
  statusMsg('Loading [loading photos]');
  let photos = flickrData.photos.photo;

  for(const photo of photos) {
    statusMsg(`Loading [loading photo #${photoCount}]`);

    if(photoCount <= 25) {
      // This is for the fancy background
      photoList.innerHTML += `
        <div class="photo" id="photo-${photo.id}" style="
          background-image: url('https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg');
          opacity: 0;
          animation-fill-mode: forwards;
          animation-delay: ${Math.floor(Math.random() * 10) + 0}s;
          margin: ${Math.floor(Math.random() * 16) + 4}px;
          height: ${Math.floor(Math.random() * 40) + 10}vh;
          width: ${Math.floor(Math.random() * 30) + 6}vw;
          border-radius: ${Math.floor(Math.random() * 8) + 1}px;
        ">
        </div>
      `;
    }

    // Every photo gets its own script element (woo lag)
    // This is so we can get the EXIF information
    // Every photo runs addPhoto
    let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.photos.getExif${flickrAPIKey}&photo_id={{PHOTOID}}&page=1&per_page=1&format=json&jsoncallback=addPhoto&extras=o_dims`.replace('{{PHOTOID}}', photo.id);

    let flickrScript = document.createElement('script');
    flickrScript.src = flickrURL;
    document.body.appendChild(flickrScript);
    flickrScript.parentNode.removeChild(flickrScript);

    photoCount++;
  }
}

let addedPhotos = 0; // Count of photos that have been added
let photoList = document.getElementById('photoList'); // The fancy background element
function addPhoto(flickrData) {
statusMsg(`Loading [adding photo #${addedPhotos}]`);

  // If there's no data or no photos/exif data then we don't do anything
  if(!flickrData) { statusMsg(`Error Adding Photo #${addedPhotos} (no data returned)`); return; }
  if(!flickrData.photo || !flickrData.photo.exif) { statusMsg(`Error Adding Photo #${addedPhotos} (no photo or exif data)`); return; }

  // Stuff below here should be p self explanatory
  let exif = flickrData.photo.exif;
  for (const element of exif) {
    if(element.tag == 'FocalLengthIn35mmFormat') {
      mm35.push(parseInt(element.raw._content));
    } else if (element.tag == 'FocalLength') {

      if(document.getElementById(`photo-${flickrData.photo.id}`)) {
        document.getElementById(`photo-${flickrData.photo.id}`).classList.add('has-mm');
        document.getElementById(`photo-${flickrData.photo.id}`).innerHTML = `<span>${parseInt(element.raw._content)}mm</span>`;
        document.getElementById(`photo-${flickrData.photo.id}`).style.order = parseInt(element.raw._content);
      }

      mm.push(parseInt(element.raw._content));
    } else {
      continue;
    }
  }
  addedPhotos++;

  // If we're on the last photo, we're done!
  if(addedPhotos >= photoCount) {
    doneEverything();
  }
}

// doneEverything just calculates the averages from the global arrays and shows things
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
    // Sometimes there aren't any 35mm conversions, so only show it if we could make the average
    mm35string = `<h2 class="animated fadeInUp">${parseInt(mm35Avg)}mm <span style="font-size: 0.8em; opacity: 0.8;">&mdash; 35mm equivalent</span><h2>`
  }

  // Hide the images in the background which we couldn't find the focal length of
  for(const e of document.querySelectorAll('div.photo:not(.has-mm)')) {
    e.style.display = 'none';
  }

  // Animate all the photos in the background
  for(const e of document.querySelectorAll('div.photo')) {
    e.classList.add('animated');
    e.classList.add('fadeIn');

    // Otherwise you could be waiting upwards of 10 seconds for a single photo fade in
    if(photoCount < 5) {
      e.style['animation-delay'] = '0s';
    }
  }

  statusMsg(`Loading [done!]`);
  document.getElementById('stuff').innerHTML = `
    <h1 class="animated fadeInUp"><span style="opacity: 0.5;">~</span>${parseInt(mmAvg)}mm</h1>
    ${mm35string}
  `;
}

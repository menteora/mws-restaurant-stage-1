let restaurant;
var map;

/**
 * Fetch restaurant as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
      const picture = document.getElementById('staticmap-picture');

      // Use different maps image from 0 to 400px
      const source = document.createElement('source');
      source.media = '(max-width: 550px)';
      source.srcset = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&scale=1&zoom=12&size=550x350&key=AIzaSyBjEzrQVpR768JpvHrJKaHZtd2e_yBD0QM'
        + `&markers=size:mid%7Ccolor:red%7C${self.restaurant.latlng.lat},${self.restaurant.latlng.lng}`;

      // Standard image is resized to maximum 600px
      const image = document.getElementById('staticmap');
      image.alt = `${restaurant.name} map`;
      image.src = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&scale=2&zoom=11&size=512x200&key=AIzaSyBjEzrQVpR768JpvHrJKaHZtd2e_yBD0QM'
        + `&markers=size:small%7Ccolor:red%7C${self.restaurant.latlng.lat},${self.restaurant.latlng.lng}`;

      // Insert source before image
      picture.insertBefore(source, image);

      // Add submit event listener for restaurant review 
      const form = document.getElementById('review-form');
      form.addEventListener('submit', function () {
        addReview(restaurant.id);
      });

      // Init service worker
      AppHelper.startServiceWorker();
    }
  });
});

/**
 * Add new review.
 */
addReview = (id) => {
  form = document.getElementById('review-form');

  DBHelper.addRestaurantReview(id, form)
    .then((review) => {
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
      document.getElementById('name').value = '';
      var radio = document.getElementsByName("rating");
      for (var i = 0; i < radio.length; i++)
        radio[i].checked = false;
      document.getElementById('comment').value = '';
    })
    .catch((error) => {
      alert(error);
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-picture');

  // Use small image from 0 to 400px
  const source = document.createElement('source');
  source.media = '(max-width: 400px)';
  source.srcset = AppHelper.setSuffixToFileAndWebpExtension(DBHelper.imageUrlForRestaurant(restaurant), '-300');

  // Standard image is resized to maximum 600px
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = `Picture of ${restaurant.name} restaurant`;
  image.src = AppHelper.setSuffixToFileAndWebpExtension(DBHelper.imageUrlForRestaurant(restaurant));

  // Insert source before image
  picture.insertBefore(source, image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  // set empty reviews
  ul.innerHTML = '';
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  // Add attribute for css
  name.setAttribute("class", "review-name");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  var createdAt = new Date(review.createdAt);
  date.innerHTML = createdAt.toDateString();
  // Add attribute for css
  date.setAttribute("class", "review-date");
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  // Add attribute for css
  rating.setAttribute("class", "review-rating");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
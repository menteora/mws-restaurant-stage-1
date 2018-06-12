let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      // Add blazy after html filled
      var bLazy = new Blazy();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  const picture = document.getElementById('staticmap-picture');

  // Use different maps image from 0 to 400px
  const source = document.createElement('source');
  source.media = '(max-width: 550px)';
  source.srcset = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&scale=1&zoom=12&size=550x350&key=AIzaSyBjEzrQVpR768JpvHrJKaHZtd2e_yBD0QM'
  // Standard image is resized to maximum 600px
  const image = document.getElementById('staticmap');
  image.src = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&scale=2&zoom=11&size=512x200&key=AIzaSyBjEzrQVpR768JpvHrJKaHZtd2e_yBD0QM';

  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
    source.srcset += `&markers=size:mid%7Ccolor:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
    image.src += `&markers=size:small%7Ccolor:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  });

  // Insert source before image
  picture.insertBefore(source, image);
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const article = document.createElement('article');
  const image = document.createElement('img');
  image.className = 'restaurant-img b-lazy';
  image.alt = `Picture of ${restaurant.name} restaurant`;
  // add blazy for lazy loading images
  image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  image.setAttribute('data-src', AppHelper.setSuffixToFileAndWebpExtension(DBHelper.imageUrlForRestaurant(restaurant), '-300'));
  article.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  article.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  article.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  article.append(address);


  const buttonContainer = document.createElement('div');
  buttonContainer.id = "button-container";

  const more = document.createElement('a');
  more.className = "details"
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  buttonContainer.append(more);

  const star = document.createElement('a');
  star.className = "star";
  const starred = restaurant.is_favorite == "true"
  star.innerHTML = (starred) ? "✭" : "✩";
  star.href = 'javascript:void(0)';
  star.addEventListener('click', function () {

    DBHelper.toogleStar(restaurant.id, restaurant.is_favorite)
      .then((response) => {
        //alert(response);
        this.innerHTML = (response.is_favorite) ? "✭" : "✩";
        //this.restaurant.is_favorite = (response.is_favorite) ? true : false;
      })
      .catch((error) => {
        alert(error);
      });

    //DBHelper.toggleFavoriteRestaurant(restaurant.id);
    //const toogleStar = document.getElementById('restaurants-list');

  });
  buttonContainer.append(star);
  article.append(buttonContainer);

  return article;
}

/**
 * Service Worker Check
 */
AppHelper.startServiceWorker();
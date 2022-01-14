const url = 'https://api.punkapi.com/v2/beers';

const elements = {
    input: document.querySelector('#search_input'),
    list: document.querySelector('#list'),
    searchList: document.querySelector('#search_list'),
    searchIcon: document.querySelector('#search_icon'),
    recent: document.querySelector('#recent'),
    loadMoreLink: document.querySelector('#load_more'),
    scrollToTopBtn: document.querySelector('#scroll-to-top-btn'),
    favouritesBtn: document.querySelector('#favourites-btn'),
    counterOfFavoriteItems: document.querySelector('#counter-of-favorite-items'),
    modal: document.querySelector('#favoritesModal'),
    closeModal: document.querySelector('.close'),
    modalList: document.querySelector('#modal-list'),
}

class App {
    constructor(apiUrl, elements) {
        this.url = apiUrl;
        //---Elements----------------------------
        this.input = elements.input;
        this.list = elements.list;
        this.searchList = elements.searchList;
        this.searchIcon = elements.searchIcon;
        this.recent = elements.recent;
        this.loadMoreLink = elements.loadMoreLink;
        this.scrollToTopBtn = elements.scrollToTopBtn;
        this.favouritesBtn = elements.favouritesBtn;
        this.counterOfFavoriteItems = elements.counterOfFavoriteItems;
        this.modal = elements.modal;
        this.closeModal = elements.closeModal;
        this.modalList = elements.modalList;
        //----------------------------------------
        //---State--------------------------------
        this.mainBeerList = {};
        this.favorites = new Set();
        this.recentList = [];
        this.page = 1;
        this.itemsOnPage = 25;
        //----------------------------------------
        //___Event Listeners----------------------
        this.input.addEventListener('keyup', this.searchHandler.bind(this));
        this.searchIcon.addEventListener('click', this.searchHandler.bind(this));
        this.loadMoreLink.addEventListener('click', this.loadMoreLinkHandler.bind(this));
        this.favouritesBtn.addEventListener('click', this.favouritesBtnHandler.bind(this));
        this.closeModal.addEventListener('click', this.closeModalHandler.bind(this));
        document.addEventListener("click", this.hideSearchListHandler.bind(this));
        document.addEventListener('click', this.searchRecallHandler.bind(this));
        document.addEventListener('click', this.addToFavoritesBtnHandler.bind(this));
        window.addEventListener("scroll", this.scrollHandler.bind(this));
        window.addEventListener('click', (e) => e.target === this.modal ? this.closeModalHandler() : null);
        this.scrollToTopBtn.addEventListener("click", this.scrollToTop.bind(this));
        //----------------------------------------
        //---Initialization_______________________
        this.rootElement = document.documentElement;
        this.searchList.style.display = 'none';
        this.scrollToTopBtn.style.visibility = 'hidden';

        if (localStorage.recentList) {
            this.recentList = JSON.parse(localStorage.getItem('recentList'));
            this.updateRecentList();
        }

        if (localStorage.favorites) {
            JSON.parse(localStorage.getItem('favorites')).forEach(item => {
                this.favorites.add(+item);
            });
            this.updateFavoritesBtn();
            this.updateCounterOfFavoriteItems();
        }

    }

    closeModalHandler() {
        this.modalList.innerHTML = '';
        this.modal.style.display = "none";

    }

    openFavoritesModal() {
        this.modal.style.display = "block";
    }

    favouritesBtnHandler(event) {
        if (this.favorites.size === 0) return;

        this.openFavoritesModal();

        this.fetchBeersById(Array.from(this.favorites))
            .then(beers => {
                this.modalList.insertAdjacentHTML('beforeend', new BeerList(beers).render());
            })

    }


    updateCounterOfFavoriteItems() {
        this.counterOfFavoriteItems.textContent = this.favorites.size || '';
        this.updateFavoritesBtn();
    }

    updateFavoritesBtn() {
        this.favorites.size ?
            this.favouritesBtn.classList.add('available') :
            this.favouritesBtn.classList.remove('available');
    }

    addToFavoritesBtnHandler(event) {
        const { target } = event;
        const { classList } = target;

        if (classList.contains('add-to-favorites-btn')) {

            classList.toggle('in-favorites');

            classList.contains('in-favorites') ?
                target.textContent = 'Remove' :
                target.textContent = 'Add';

            const id = +target.id;

            if (target.closest('#search_list')) {
                this.checkMainListOnFavorites(id);
            }

            if (target.closest('#modal-list')) {
                this.checkMainListOnFavorites(id);
                target.closest('li').remove();
                if (this.favorites.size === 1) {
                    this.closeModalHandler();
                }
            }

            if (this.favorites.has(id)) {
                this.favorites.delete(id);
                this.updateFavoritesInLocalStorage();
            } else {
                this.favorites.add(id);
                this.updateFavoritesInLocalStorage();
            }
            this.updateCounterOfFavoriteItems();
        }
    }

    updateFavoritesInLocalStorage() {
        localStorage.setItem('favorites', JSON.stringify(Array.from(this.favorites)));
    }

    checkMainListOnFavorites(id) {
        const mainListButton = this.list.querySelector(`[id="${id}"]`);

        if (mainListButton) {
            mainListButton.classList.toggle('in-favorites');
            mainListButton.classList.contains('in-favorites') ?
                mainListButton.textContent = 'Remove' :
                mainListButton.textContent = 'Add';
        }
    }

    searchRecallHandler(event) {
        if (event.target.closest('ul') === this.recent) {
            this.input.value = event.target.textContent;
            this.search(true);
        }
    }

    scrollHandler() {
        if (window.scrollY === 0) {
            setTimeout(this.hideScrollButton.bind(this), 300);
            this.scrollToTopBtn.style.opacity = '0';
        } else {
            this.scrollToTopBtn.style.visibility = 'visible';
            this.scrollToTopBtn.style.opacity = '1';
        }
    }

    hideScrollButton() {
        this.scrollToTopBtn.style.visibility = 'hidden';
    }

    scrollToTop() {
        this.rootElement.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    searchHandler(event) {
        const {key, target} = event;
        if (key === 'Enter' && this.input.value.length > 0 || target === this.searchIcon && this.input.value.length > 0) {
            this.search()
        }
    }

    loadMoreLinkHandler(event) {
        event.preventDefault();
        this.fetchPerPage(this.page)
            .then(this.insertBeersInList.bind(this))

    }

    hideSearchListHandler(event) {
        if (event.target.closest('ul') === this.searchList || event.target === this.input) {
        return;
        }
    this.searchList.innerHTML = '';
    this.searchList.style.display = 'none';
    }

    async renderStartList() {
        const beers = await this.fetchPerPage(this.page, this.itemsOnPage);
        this.list.insertAdjacentHTML('beforeend', new BeerList(beers).render());
    }

    insertBeersInList(beers) {
        this.list.insertAdjacentHTML('beforeend', new BeerList(beers).render());
        if (beers.length < this.itemsOnPage) {
            this.loadMoreLink.innerHTML = '';
            setTimeout(() => alert('No more items left.'), 500);

        }
    }

    search(recall = false) {
        this.searchList.innerHTML = '';
        this.fetchBeersByName(this.input.value)
            .then(beers => {
                if (beers.length === 0) {
                    alert('There were no properties found for \n' +
                        '   the given location.');
                    return;
                }
                this.searchList.insertAdjacentHTML("afterbegin", new BeerList(beers).render());
                this.searchList.style.display = 'block';
            })
            .finally(() => {
            this.addToRecent(this.input.value);

            if (!recall) {
                this.input.value = '';
            }
        });

    }

    addToRecent(value) {
        this.recent.innerHTML = '';
        if (!this.recentList.includes(value)) {
            this.recentList.push(value);

            if (this.recentList.length > 3) {
                this.recentList.shift();
            }
        }
        localStorage.setItem('recentList', JSON.stringify(this.recentList));
        this.updateRecentList();
    }

    updateRecentList() {
        this.recentList.forEach(item => {
            this.recent.insertAdjacentHTML('afterbegin', `<li class="recent_search_item">${item}</li>`);
        });
    }

    async fetchBeersByName(name) {
        try {
            const response = await fetch(this.url + '/?beer_name=' + name);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchBeersById(idsArray) {
        try {
            const response = await fetch(this.url + `/?ids=${idsArray.join('|')}` + name);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error)
        }
    }

    async fetchPerPage() {
        try {
            const response = await fetch(this.url + '?page=' + this.page + '&per_page=' + this.itemsOnPage);
            if (response.ok) {
                const jsonResponse = await response.json();
                this.page++;
                return await jsonResponse;
            }
        } catch(error) {
            console.log(error)
        }
    }
}

class BeerList {
    constructor(beers) {
        this.beers = beers;

    }

    render() {
        const arrayOfElements = this.beers.map(beer => {
            return new Beer(beer).render();
        })
        return arrayOfElements.join('');
    }

}

class Beer {
    constructor(beer) {
        this.id = beer.id;
        this.title = beer.name;
        this.description = beer.description;
        this.image_url = beer.image_url;
        this.price = Math.floor(Math.random() * 100);
        this.inFavorites = app.favorites.has(beer.id);
    }

    render() {
        return `
            <li> 
                <article class="beer_card">
                    <h4 class="card_header">${this.title}</h4>
                    <img class="card_image" src="${this.image_url}" alt="beer image">
                    <p class="description">${this.description}</p>
                    <fieldset class="beer-card_bottom">            
                        <p class="price">\$${this.price}</p>
                        <button 
                            type="button" 
                            class="add-to-favorites-btn ${this.inFavorites ? 'in-favorites' : ''}" 
                            id="${this.id}">
                                ${this.inFavorites ? 'Remove' : 'Add'}
                            </button>
                    </fieldset>
                    
                    </article>
            </li>`
    }
}

const app = new App(url, elements);
app.renderStartList().then();

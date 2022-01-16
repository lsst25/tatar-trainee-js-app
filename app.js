const url = 'https://api.punkapi.com/v2/beers';

const elements = {
    searchInput: document.querySelector('#search_input'),
    mainList: document.querySelector('#main-list'),
    searchList: document.querySelector('#search_list'),
    searchIcon: document.querySelector('#search_icon'),
    recentList: document.querySelector('#recent'),
    loadMoreLink: document.querySelector('#load_more'),
    scrollToTopBtn: document.querySelector('#scroll-to-top-btn'),
    favouritesBtn: document.querySelector('#favourites-btn'),
    counterOfFavoriteItems: document.querySelector('#counter-of-favorite-items'),
    modal: document.querySelector('#favoritesModal'),
    closeModalSpan: document.querySelector('.close'),
    modalList: document.querySelector('#modal-list'),
}

class App {
    constructor(apiUrl, elements) {
        this.url = apiUrl;
        //---Elements----------------------------
        this.searchInput = elements.searchInput;
        this.mainList = elements.mainList;
        this.searchList = elements.searchList;
        this.searchIcon = elements.searchIcon;
        this.recentSearchesList = elements.recentList;
        this.loadMoreLink = elements.loadMoreLink;
        this.scrollToTopBtn = elements.scrollToTopBtn;
        this.favouritesBtn = elements.favouritesBtn;
        this.counterOfFavoriteItems = elements.counterOfFavoriteItems;
        this.modal = elements.modal;
        this.closeModalSpan = elements.closeModalSpan;
        this.modalList = elements.modalList;
        //----------------------------------------
        //---State--------------------------------
        this.favorites = new Set();
        this.recent = [];
        this.page = 1;
        this.itemsOnPage = 25;
        //----------------------------------------
        //___Event Listeners----------------------
        this.searchInput.addEventListener('keyup', this.searchHandler.bind(this));
        this.searchIcon.addEventListener('click', this.searchHandler.bind(this));
        this.loadMoreLink.addEventListener('click', this.loadMoreLinkHandler.bind(this));
        this.favouritesBtn.addEventListener('click', this.favouritesBtnHandler.bind(this));
        this.closeModalSpan.addEventListener('click', this.closeModalHandler.bind(this));
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

        if (localStorage.recent) {
            this.recent = JSON.parse(localStorage.getItem('recent'));
            this.updateRecent();
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

    favouritesBtnHandler() {
        const empty = this.favorites.size === 0;
        if (empty) {
            return
        }
        this.openFavoritesModal();
        this.fetchItemsById(Array.from(this.favorites))
            .then(itemsArray => {
                this.insertItemsInList(itemsArray, this.modalList);
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
        const isAddToFavoritesBtn = target.classList.contains('add-to-favorites-btn');

        if (isAddToFavoritesBtn) {
            this.toggleAddToFavoritesBtn(target);

            const id = +target.id;
            const btnIsInSearchList = target.closest('#search_list');
            const btnIsInModalList = target.closest('#modal-list');

            if (btnIsInSearchList) {
                this.checkMainListOnFavorites(id);
            }

            if (btnIsInModalList) {
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
        const mainListButton = this.mainList.querySelector(`[id="${id}"]`);
        if (mainListButton) {
            this.toggleAddToFavoritesBtn(mainListButton);
        }
    }

    toggleAddToFavoritesBtn(favoritesButton) {
        favoritesButton.classList.toggle('in-favorites');
        favoritesButton.classList.contains('in-favorites') ?
            favoritesButton.textContent = 'Remove' :
            favoritesButton.textContent = 'Add';
    }

    searchRecallHandler({ target }) {
        const isRecentSearchLiElement = target.closest('ul') === this.recentSearchesList && target.classList.contains('recent_search_item');
        if (isRecentSearchLiElement) {
            this.searchInput.value = target.textContent;
            this.search(true);
        }
    }

    scrollHandler() {
        const scrolledToTop = window.scrollY === 0;
        if (scrolledToTop) {
            setTimeout(this.hideScrollToTopButton.bind(this), 300);
            this.scrollToTopBtn.style.opacity = '0';
        } else {
            this.scrollToTopBtn.style.visibility = 'visible';
            this.scrollToTopBtn.style.opacity = '1';
        }
    }

    hideScrollToTopButton() {
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
        if (key === 'Enter' && this.searchInput.value.length > 0 || target === this.searchIcon && this.searchInput.value.length > 0) {
            this.search()
        }
    }

    loadMoreLinkHandler(event) {
        event.preventDefault();
        this.fetchItemsPerPage(this.page)
            .then(this.insertItemsInMainList.bind(this));
    }

    hideSearchListHandler(event) {
        const noNeedToHide = event.target.closest('ul') === this.searchList || event.target === this.searchInput;
        if (noNeedToHide) {
            return
        }
        this.clearSearchList();
        this.hideSearchList();
    }

    async renderStartList() {
        const itemsArray = await this.fetchItemsPerPage(this.page, this.itemsOnPage);
        this.insertItemsInList(itemsArray, this.mainList);
    }

    insertItemsInMainList(itemsArray) {
        this.insertItemsInList(itemsArray, this.mainList);
        if (itemsArray.length < this.itemsOnPage) {
            this.loadMoreLink.innerHTML = '';
            setTimeout(() => alert('No more items left.'), 500);
        }
    }

    search(recall = false) {
        this.clearSearchList();
        this.fetchItemsByName(this.searchInput.value)
            .then(itemsArray => {
                const nothingFound = itemsArray.length === 0;
                if (nothingFound) {
                    alert('There were no properties found for \n' +
                        '   the given location.');
                    return;
                }
                this.insertItemsInList(itemsArray, this.searchList);
                this.openSearchList();
            })
            .finally(() => {
            this.addToRecent(this.searchInput.value);
            if (!recall) {
                this.searchInput.value = '';
            }
        });
    }

    insertItemsInList(itemsArray, list) {
        list.insertAdjacentHTML("beforeend", new ItemsList(itemsArray, this.favorites).render());
    }

    openSearchList() {
        this.searchList.style.display = 'block';
    }

    clearSearchList() {
        this.searchList.innerHTML = '';
    }

    hideSearchList() {
        this.searchList.style.display = 'none';
    }

    addToRecent(value) {
        this.recentSearchesList.innerHTML = '';
        if (!this.recent.includes(value)) {
            this.recent.push(value);

            if (this.recent.length > 3) {
                this.recent.shift();
            }
        }
        localStorage.setItem('recent', JSON.stringify(this.recent));
        this.updateRecent();
    }

    updateRecent() {
        this.recent.forEach(text => {
            this.recentSearchesList.insertAdjacentHTML('afterbegin', `<li class="recent_search_item">${text}</li>`);
        });
    }

    async fetchItemsByName(name) {
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

    async fetchItemsById(idsArray) {
        try {
            const response = await fetch(this.url + `/?ids=${idsArray.join('|')}`);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchItemsPerPage() {
        try {
            const response = await fetch(this.url + '?page=' + this.page + '&per_page=' + this.itemsOnPage);
            if (response.ok) {
                const jsonResponse = await response.json();
                this.page++;
                return await jsonResponse;
            }
        } catch(error) {
            console.log(error);
        }
    }
}

class ItemsList {
    constructor(items, favorites) {
        this.beers = items;
        this.favorites = favorites;

    }

    render() {
        const arrayOfElements = this.beers.map(item => {
            return new ItemCard(item, this.favorites.has(item.id)).render();
        })
        return arrayOfElements.join('');
    }

}

class ItemCard {
    constructor(item, inFavorites) {
        this.id = item.id;
        this.title = item.name;
        this.description = item.description;
        this.image_url = item.image_url;
        this.price = Math.floor(Math.random() * 100/4);
        this.inFavorites = inFavorites;
    }

    render() {
        return `
            <li> 
                <article class="item_card">
                    <h4 class="card_header">${this.title}</h4>
                    <img class="card_image" src="${this.image_url}" alt="image">
                    <p class="description">${this.description}</p>
                    <fieldset class="item-card_bottom">            
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

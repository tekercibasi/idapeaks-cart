document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements for better performance and readability
    const dom = {
        productsContainer: document.querySelector('#product-list'),
        cart: document.querySelector('#mini-cart'),
        cartItemsList: document.querySelector('#cart-items'),
        totalItemsElem: document.querySelector('#total-items'),
        totalPriceElem: document.querySelector('#total-price'),
        searchInput: document.querySelector('#search-input'),
        loginForm: document.querySelector('#login-form'),
        loginButton: document.querySelector('#login-button'),
        usernameInput: document.querySelector('#username'),
        passwordInput: document.querySelector('#password'),
        addSelectedToCartButton: document.querySelector('#add-to-cart-button'),
        addToCartButton: document.querySelector('.add-to-cart-button'),
    }

    // Initialize state from localStorage or set to empty array
    const SkuInCart = JSON.parse(localStorage.getItem('SkuInCart')) || [];
    const SelectedProducts = [];
    const ProductData = [];

    // Load products from JSON file and render them
    const loadProducts = () => {
        fetch('./data/products.json')
            .then(response => response.json())
            .then(data => {
                ProductData.push(...data);
                renderProducts(data);
            });
    }

    // Calculate the average of numbers in an array
    const getArrayAverage = (numbers) => {
        const sum = numbers.reduce((total, num) => total + num, 0);
        return sum / numbers.length;
    }

    // Render the list of products
    const renderProducts = (products) => {
        dom.productsContainer.innerHTML = '';
        products.forEach(product => {
            // Get product rating from localStorage
            let productRating = JSON.parse(localStorage.getItem(`productRating-${product.sku}`)) || 0;
            productRating = Array.isArray(productRating) ? productRating : [];

            // Create product element
            const productElem = document.createElement('div');
            productElem.className = 'col-md-4 product-item';
            productElem.dataset.sku = product.sku;
            productElem.dataset.campaign = product.isCampaign;
            productElem.dataset.new = product.isNew;

            // Generate HTML for product rating if available
            let ratingHTML = (productRating.length < 1) ? '' : `<p class="card-text">Rating: ${getArrayAverage(productRating).toFixed(2)} ⭐</p>`;
            productElem.draggable = true;

            // Set inner HTML for product element
            productElem.innerHTML = `
                <div class="card">
                    <div class="checkbox-container" style="position: absolute; top: 10px; right: 10px;">
                        <input type="checkbox" class="product-checkbox">
                    </div>
                    <div class="img-container">
                        <img src="${product.image_paths[0]}" class="card-img-top" alt="${product.product_name}">
                    </div>
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title">${product.product_name}</h5>
                            <p class="card-text price">$${product.price}</p>
                            <p class="card-text">${product.description}</p>
                            ${ratingHTML}
                        </div>
                        <div>
                            <button class="btn btn-success add-to-cart-button">Add to Cart</button>
                            <button class="btn btn-primary rate-button">Rate</button>
                        </div>
                    </div>
                </div>
            `;

            // Handle checkbox changes to update selected products
            const checkbox = productElem.querySelector('.product-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!SelectedProducts.includes(product.sku)) {
                        SelectedProducts.push(product.sku);
                    }
                } else {
                    const index = SelectedProducts.indexOf(product.sku);
                    if (index > -1) {
                        SelectedProducts.splice(index, 1);
                    }
                }
                dom.addSelectedToCartButton.style.display = SelectedProducts.length > 0 ? 'block' : 'none';
            });

            // Handle drag start event for the product element
            productElem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', product.sku);
            });

            // Handle "Add to Cart" button click
            productElem.querySelector('.add-to-cart-button').addEventListener('click', (e) => {
                const sku = e.currentTarget.closest('.product-item').dataset.sku;
                const currentProduct = SkuInCart.find(p => p.sku === sku);
                if (currentProduct) {
                    currentProduct.qty += 1;
                } else {
                    SkuInCart.push({ sku, qty: 1 });
                }
                saveCart();
                updateCart();
            });

            // Handle "Rate" button click
            productElem.querySelector('.rate-button').addEventListener('click', (e) => {
                const rating = prompt('Rate this product (1-5):');
                if (rating >= 1 && rating <= 5) {
                    let currentSKU = e.currentTarget.closest('.product-item').dataset.sku;
                    saveRating(currentSKU, rating);
                    alert(`You rated ${product.product_name} with ${rating} stars.`);
                } else {
                    alert('Invalid rating. Please enter a number between 1 and 5.');
                }
            });

            // Append product element to container
            dom.productsContainer.appendChild(productElem);
        });
        updateCart();
    }

    // Update the cart with current items
    const updateCart = () => {
        dom.cartItemsList.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;
        SkuInCart.forEach(item => {
            const product = ProductData.find(p => p.sku === item.sku);
            if (product) {
                const li = document.createElement('li');
                li.textContent = `${product.product_name} - $${product.price}`;
                const qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.value = item.qty;
                qtyInput.min = 1;
                qtyInput.addEventListener('change', (e) => {
                    item.qty = parseInt(e.target.value, 10);
                    saveCart();
                    updateCart();
                });
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'btn btn-danger btn-sm';
                removeButton.addEventListener('click', () => {
                    const index = SkuInCart.indexOf(item);
                    SkuInCart.splice(index, 1);
                    saveCart();
                    updateCart();
                });
                li.appendChild(qtyInput);
                li.appendChild(removeButton);
                dom.cartItemsList.appendChild(li);
                totalItems += item.qty;
                totalPrice += item.qty * product.price;
            }
        });
        dom.totalItemsElem.textContent = totalItems;
        dom.totalPriceElem.textContent = totalPrice.toFixed(2);
    }

    // Save the current cart to localStorage
    const saveCart = () => {
        localStorage.setItem('SkuInCart', JSON.stringify(SkuInCart));
    }

    // Save the product rating to localStorage
    const saveRating = (sku, rating) => {
        let productRating = JSON.parse(localStorage.getItem(`productRating-${sku}`)) || [];
        productRating = Array.isArray(productRating) ? productRating : [];
        productRating.push(parseInt(rating, 10));
        localStorage.setItem(`productRating-${sku}`, JSON.stringify(productRating));
        location.reload();
    }

    // Handle "Add Selected to Cart" button click
    dom.addSelectedToCartButton.addEventListener('click', () => {
        SelectedProducts.forEach(sku => {
            const product = SkuInCart.find(p => p.sku === sku);
            if (product) {
                product.qty += 1;
            } else {
                SkuInCart.push({ sku, qty: 1 });
            }
        });
        saveCart();
        updateCart();
        SelectedProducts.length = 0; // Clear the selected products
        dom.addSelectedToCartButton.style.display = 'none'; // Hide the button
    });

    // Handle global dragover event to add dragover class to body
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.querySelector("body").classList.add('dragover');
    });

    // Handle global dragend event to remove dragover class from body
    document.addEventListener('dragend', () => {
        document.querySelector("body").classList.remove('dragover');
    });

    // Handle drop event on cart to add items to cart
    dom.cart.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.cart.classList.remove('dragover');
        const sku = e.dataTransfer.getData('text/plain');
        const product = SkuInCart.find(p => p.sku === sku);
        if (product) {
            product.qty += 1;
        } else {
            SkuInCart.push({ sku, qty: 1 });
        }
        saveCart();
        updateCart();
    });

    // Filter products based on search input
    dom.searchInput.addEventListener('input', () => {
        const searchTerm = dom.searchInput.value.toLowerCase();
        const filteredProducts = ProductData.filter(product => product.product_name.toLowerCase().includes(searchTerm));
        renderProducts(filteredProducts);
    });

    // Check if user is logged in and update UI accordingly
    if (sessionStorage.getItem("loggedIn") === "true") {
        dom.loginForm.remove();
    } else {
        // Handle login button click
        dom.loginButton.addEventListener('click', () => {
            const username = dom.usernameInput.value;
            const password = dom.passwordInput.value;
            if (username === 'user' && password === 'password') {
                alert('Login successful!');
                dom.loginForm.style.display = 'none';
                updateCart();
                sessionStorage.setItem('loggedIn', true);
            } else {
                alert('Invalid username or password.');
            }
        });
    }

    // Load products and update cart on page load
    loadProducts();
    updateCart();
});

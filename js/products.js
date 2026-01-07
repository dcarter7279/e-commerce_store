// Product Module
// Handles product display and management

// Sample product data with enhanced details
const productsData = [
    {
        id: 1,
        name: "Premium Wireless Headphones",
        description: "High-quality wireless headphones with active noise cancellation",
        longDescription: "Experience crystal-clear audio with our premium wireless headphones featuring advanced active noise cancellation technology. Perfect for music lovers, travelers, and professionals who demand the best sound quality.",
        price: 99.99,
        originalPrice: 149.99,
        category: "audio",
        image: "https://via.placeholder.com/600x600/667eea/ffffff?text=Headphones",
        images: [
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Headphones+Main",
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Headphones+Side",
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Headphones+Case",
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Headphones+Detail"
        ],
        featured: true,
        badge: "Sale",
        rating: 4.8,
        reviewCount: 245,
        stock: 45,
        sku: "AUD-WH-001",
        features: [
            "Active noise cancellation for immersive sound",
            "30-hour battery life on a single charge",
            "Premium memory foam ear cushions for all-day comfort",
            "Bluetooth 5.0 for stable wireless connectivity",
            "Built-in microphone for hands-free calls",
            "Foldable design with premium carrying case"
        ],
        specifications: {
            "Brand": "E-Store Audio",
            "Model": "ProSound X1",
            "Driver Size": "40mm",
            "Frequency Response": "20Hz - 20kHz",
            "Impedance": "32 Ohms",
            "Battery Life": "30 hours",
            "Charging Time": "2 hours",
            "Bluetooth Version": "5.0",
            "Weight": "250g",
            "Warranty": "2 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "John Smith",
                rating: 5,
                date: "2026-01-01",
                comment: "Amazing sound quality and the noise cancellation is top-notch. Best headphones I've ever owned!",
                helpful: 15
            },
            {
                author: "Sarah Johnson",
                rating: 4,
                date: "2025-12-28",
                comment: "Great headphones, very comfortable for long listening sessions. Only downside is they're a bit bulky for travel.",
                helpful: 8
            },
            {
                author: "Mike Chen",
                rating: 5,
                date: "2025-12-20",
                comment: "Battery life is incredible! I charge them once a week and use them daily. Highly recommend!",
                helpful: 12
            }
        ]
    },
    {
        id: 2,
        name: "Smart Watch Pro",
        description: "Feature-rich smartwatch with fitness tracking and health monitoring",
        longDescription: "Stay connected and track your fitness goals with our advanced Smart Watch Pro. Featuring comprehensive health monitoring, GPS tracking, and seamless smartphone integration.",
        price: 199.99,
        originalPrice: 249.99,
        category: "wearables",
        image: "https://via.placeholder.com/600x600/764ba2/ffffff?text=Smart+Watch",
        images: [
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Watch+Front",
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Watch+Side",
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Watch+Apps",
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Watch+Strap"
        ],
        featured: true,
        badge: "Featured",
        rating: 4.6,
        reviewCount: 189,
        stock: 8,
        sku: "WRB-SW-002",
        features: [
            "1.4-inch AMOLED touchscreen display",
            "Heart rate and SpO2 monitoring",
            "Built-in GPS for accurate activity tracking",
            "Water resistant up to 50 meters",
            "7-day battery life with normal use",
            "Compatible with iOS and Android devices"
        ],
        specifications: {
            "Brand": "E-Store Wearables",
            "Model": "SmartWatch Pro X2",
            "Display": "1.4-inch AMOLED",
            "Resolution": "454 x 454 pixels",
            "Battery": "300mAh",
            "Battery Life": "7 days",
            "Water Resistance": "5ATM (50m)",
            "Sensors": "Heart Rate, SpO2, Accelerometer, Gyroscope, GPS",
            "Connectivity": "Bluetooth 5.1",
            "Compatibility": "iOS 12+, Android 6.0+",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Emily Davis",
                rating: 5,
                date: "2026-01-03",
                comment: "Perfect smartwatch! Tracks everything I need and the battery lasts all week. Love the design too!",
                helpful: 22
            },
            {
                author: "Robert Wilson",
                rating: 4,
                date: "2025-12-30",
                comment: "Good watch overall. GPS is accurate and health tracking features are useful. Would be 5 stars if it had wireless charging.",
                helpful: 11
            }
        ]
    },
    {
        id: 3,
        name: "Ergonomic Laptop Stand",
        description: "Premium aluminum laptop stand with adjustable height",
        longDescription: "Improve your posture and productivity with our ergonomic laptop stand. Made from high-quality aluminum with 6 adjustable height positions for optimal viewing angle.",
        price: 49.99,
        category: "accessories",
        image: "https://via.placeholder.com/600x600/f093fb/ffffff?text=Laptop+Stand",
        images: [
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Stand+Front",
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Stand+Angle",
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Stand+In+Use"
        ],
        featured: false,
        rating: 4.7,
        reviewCount: 156,
        stock: 120,
        sku: "ACC-LS-003",
        features: [
            "6 adjustable height positions",
            "Supports laptops up to 17 inches",
            "Premium aluminum construction",
            "Non-slip rubber pads for stability",
            "Improves airflow and cooling",
            "Lightweight and portable design"
        ],
        specifications: {
            "Material": "Aluminum Alloy",
            "Adjustable Heights": "6 positions (2.5-6 inches)",
            "Maximum Load": "10kg (22lbs)",
            "Compatibility": "Laptops 10-17 inches",
            "Dimensions": "10 x 9.5 x 1.5 inches",
            "Weight": "800g",
            "Color": "Space Gray",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Lisa Anderson",
                rating: 5,
                date: "2025-12-25",
                comment: "Exactly what I needed for my home office setup. Sturdy and adjustable. My neck pain is gone!",
                helpful: 18
            }
        ]
    },
    {
        id: 4,
        name: "RGB Mechanical Keyboard",
        description: "Premium RGB mechanical keyboard with hot-swappable switches",
        longDescription: "Elevate your typing and gaming experience with our premium RGB mechanical keyboard. Features hot-swappable switches, customizable RGB lighting, and programmable keys.",
        price: 129.99,
        originalPrice: 179.99,
        category: "peripherals",
        image: "https://via.placeholder.com/600x600/4facfe/ffffff?text=Keyboard",
        images: [
            "https://via.placeholder.com/600x600/4facfe/ffffff?text=Keyboard+Top",
            "https://via.placeholder.com/600x600/4facfe/ffffff?text=Keyboard+RGB",
            "https://via.placeholder.com/600x600/4facfe/ffffff?text=Keyboard+Side",
            "https://via.placeholder.com/600x600/4facfe/ffffff?text=Keyboard+Detail"
        ],
        featured: true,
        badge: "Sale",
        rating: 4.9,
        reviewCount: 312,
        stock: 25,
        sku: "PER-KB-004",
        features: [
            "Hot-swappable mechanical switches",
            "Per-key RGB backlighting with 16.8M colors",
            "Full N-key rollover for gaming",
            "Aluminum frame construction",
            "Detachable USB-C cable",
            "Programmable macros and keys"
        ],
        specifications: {
            "Switch Type": "Hot-swappable Mechanical (Red/Blue/Brown)",
            "Backlight": "Per-key RGB LED",
            "Key Rollover": "Full N-Key",
            "Connection": "USB-C (Detachable)",
            "Polling Rate": "1000Hz",
            "Layout": "104-key Full Size",
            "Dimensions": "17.5 x 5.3 x 1.6 inches",
            "Weight": "950g",
            "Warranty": "2 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Alex Turner",
                rating: 5,
                date: "2026-01-05",
                comment: "Best keyboard I've ever used! The switches feel amazing and the RGB lighting is stunning. Worth every penny!",
                helpful: 45
            },
            {
                author: "Jessica Lee",
                rating: 5,
                date: "2025-12-29",
                comment: "Perfect for both gaming and work. Hot-swappable switches are a game changer. Highly recommended!",
                helpful: 28
            }
        ]
    },
    {
        id: 5,
        name: "Ergonomic Wireless Mouse",
        description: "Precision wireless mouse with ergonomic vertical design",
        longDescription: "Reduce wrist strain with our ergonomic wireless mouse. Features a vertical design that promotes a natural handshake position for all-day comfort.",
        price: 39.99,
        category: "peripherals",
        image: "https://via.placeholder.com/600x600/00f2fe/ffffff?text=Mouse",
        images: [
            "https://via.placeholder.com/600x600/00f2fe/ffffff?text=Mouse+Front",
            "https://via.placeholder.com/600x600/00f2fe/ffffff?text=Mouse+Side",
            "https://via.placeholder.com/600x600/00f2fe/ffffff?text=Mouse+Top"
        ],
        featured: true,
        rating: 4.5,
        reviewCount: 98,
        stock: 75,
        sku: "PER-MS-005",
        features: [
            "Ergonomic vertical design reduces wrist strain",
            "Precision optical sensor up to 2400 DPI",
            "2.4GHz wireless connectivity",
            "6 programmable buttons",
            "Long-lasting rechargeable battery",
            "Compatible with Windows and Mac"
        ],
        specifications: {
            "Sensor Type": "Optical",
            "DPI": "800/1200/1600/2400",
            "Buttons": "6 programmable",
            "Connection": "2.4GHz Wireless USB",
            "Battery": "Rechargeable Li-ion",
            "Battery Life": "60 days",
            "Dimensions": "4.7 x 3.1 x 2.8 inches",
            "Weight": "120g",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "David Martinez",
                rating: 4,
                date: "2025-12-27",
                comment: "Took a few days to get used to the vertical design, but now I love it. My wrist pain is much better!",
                helpful: 14
            }
        ]
    },
    {
        id: 6,
        name: "USB-C Hub 7-in-1",
        description: "Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader",
        longDescription: "Expand your laptop's connectivity with our versatile 7-in-1 USB-C hub. Features HDMI 4K output, USB 3.0 ports, SD/TF card readers, and more.",
        price: 59.99,
        category: "accessories",
        image: "https://via.placeholder.com/600x600/43e97b/ffffff?text=USB+Hub",
        images: [
            "https://via.placeholder.com/600x600/43e97b/ffffff?text=Hub+Front",
            "https://via.placeholder.com/600x600/43e97b/ffffff?text=Hub+Ports",
            "https://via.placeholder.com/600x600/43e97b/ffffff?text=Hub+In+Use"
        ],
        featured: true,
        rating: 4.6,
        reviewCount: 134,
        stock: 60,
        sku: "ACC-HB-006",
        features: [
            "7-in-1 design with multiple ports",
            "HDMI port supports 4K@30Hz output",
            "3x USB 3.0 ports for high-speed data transfer",
            "SD and microSD card readers",
            "USB-C PD charging up to 100W",
            "Compact aluminum design"
        ],
        specifications: {
            "Ports": "1x HDMI, 3x USB 3.0, 1x SD, 1x microSD, 1x USB-C PD",
            "HDMI Resolution": "4K@30Hz",
            "USB Transfer Speed": "5Gbps",
            "Power Delivery": "100W max",
            "Material": "Aluminum Alloy",
            "Compatibility": "USB-C devices, MacBook, iPad Pro, etc.",
            "Dimensions": "4.7 x 1.8 x 0.5 inches",
            "Weight": "85g",
            "Warranty": "18 Months Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Karen Thompson",
                rating: 5,
                date: "2026-01-02",
                comment: "Perfect hub for my MacBook! All the ports I need in a compact design. Works flawlessly!",
                helpful: 19
            }
        ]
    },
    {
        id: 7,
        name: "Waterproof Bluetooth Speaker",
        description: "Portable waterproof Bluetooth speaker with 360° sound",
        longDescription: "Take your music anywhere with our rugged waterproof Bluetooth speaker. Features 360-degree sound, IPX7 waterproof rating, and 20-hour battery life.",
        price: 79.99,
        originalPrice: 99.99,
        category: "audio",
        image: "https://via.placeholder.com/600x600/667eea/ffffff?text=Speaker",
        images: [
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Speaker+Front",
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Speaker+Top",
            "https://via.placeholder.com/600x600/667eea/ffffff?text=Speaker+Water"
        ],
        featured: false,
        badge: "Sale",
        rating: 4.7,
        reviewCount: 167,
        stock: 35,
        sku: "AUD-SP-007",
        features: [
            "IPX7 waterproof rating - fully submersible",
            "360-degree immersive sound",
            "20-hour battery life",
            "Bluetooth 5.0 connectivity",
            "Built-in microphone for hands-free calls",
            "Compact and portable design"
        ],
        specifications: {
            "Output Power": "20W",
            "Frequency Response": "60Hz - 20kHz",
            "Bluetooth Version": "5.0",
            "Waterproof Rating": "IPX7",
            "Battery Capacity": "5200mAh",
            "Battery Life": "20 hours",
            "Charging Time": "3.5 hours",
            "Dimensions": "7.5 x 3.5 x 3.5 inches",
            "Weight": "650g",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Tom Harris",
                rating: 5,
                date: "2025-12-31",
                comment: "Amazing speaker for the price! Sound quality is great and it survived being dropped in the pool. Love it!",
                helpful: 16
            }
        ]
    },
    {
        id: 8,
        name: "Advanced Fitness Tracker",
        description: "Slim fitness tracker with heart rate and sleep monitoring",
        longDescription: "Track your health and fitness goals with our advanced fitness tracker. Features continuous heart rate monitoring, sleep analysis, and multi-sport modes.",
        price: 89.99,
        category: "wearables",
        image: "https://via.placeholder.com/600x600/764ba2/ffffff?text=Fitness+Tracker",
        images: [
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Tracker+Front",
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Tracker+Display",
            "https://via.placeholder.com/600x600/764ba2/ffffff?text=Tracker+Worn"
        ],
        featured: false,
        rating: 4.4,
        reviewCount: 89,
        stock: 50,
        sku: "WRB-FT-008",
        features: [
            "Continuous heart rate monitoring",
            "Advanced sleep tracking and analysis",
            "14 sport modes",
            "5ATM water resistance",
            "14-day battery life",
            "Smart notifications from your phone"
        ],
        specifications: {
            "Display": "0.95-inch AMOLED",
            "Resolution": "240 x 120 pixels",
            "Battery": "125mAh",
            "Battery Life": "14 days",
            "Water Resistance": "5ATM (50m)",
            "Sensors": "Heart Rate, Accelerometer",
            "Connectivity": "Bluetooth 5.0",
            "Compatibility": "iOS 10+, Android 5.0+",
            "Weight": "24g (without strap)",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Michelle Brown",
                rating: 4,
                date: "2025-12-26",
                comment: "Good fitness tracker for the price. Battery life is excellent and it tracks my runs accurately.",
                helpful: 7
            }
        ]
    },
    {
        id: 9,
        name: "Premium Phone Case",
        description: "Protective phone case with military-grade drop protection",
        longDescription: "Protect your phone with our premium case featuring military-grade drop protection and a sleek design. Compatible with wireless charging.",
        price: 24.99,
        category: "accessories",
        image: "https://via.placeholder.com/600x600/f093fb/ffffff?text=Phone+Case",
        images: [
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Case+Front",
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Case+Back",
            "https://via.placeholder.com/600x600/f093fb/ffffff?text=Case+On+Phone"
        ],
        featured: false,
        badge: "New",
        rating: 4.8,
        reviewCount: 203,
        stock: 150,
        sku: "ACC-PC-009",
        features: [
            "Military-grade drop protection (MIL-STD 810G)",
            "Raised bezels protect screen and camera",
            "Wireless charging compatible",
            "Premium TPU and polycarbonate construction",
            "Precise cutouts for all ports",
            "Anti-slip grip texture"
        ],
        specifications: {
            "Material": "TPU + Polycarbonate",
            "Drop Protection": "MIL-STD 810G (10ft)",
            "Wireless Charging": "Yes",
            "Compatibility": "Multiple phone models available",
            "Colors": "Black, Navy Blue, Rose Gold",
            "Weight": "45g",
            "Thickness": "2mm",
            "Warranty": "1 Year Manufacturer Warranty"
        },
        reviews: [
            {
                author: "Chris Parker",
                rating: 5,
                date: "2026-01-04",
                comment: "Best case I've owned! Dropped my phone twice and not a scratch. Feels great in hand too!",
                helpful: 31
            },
            {
                author: "Amanda White",
                rating: 5,
                date: "2025-12-23",
                comment: "Love this case! Perfect fit and the raised edges really protect the screen. Highly recommend!",
                helpful: 22
            }
        ]
    }
];

// Get all products
export function getAllProducts() {
    return productsData;
}

// Get product by ID
export function getProductById(id) {
    return productsData.find(product => product.id === id);
}

// Create product card HTML
export function createProductCard(product) {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-container">
                ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                <a href="product-detail.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                </a>
            </div>
            <div class="product-content">
                <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                    <h3 class="product-name">${product.name}</h3>
                </a>
                <p class="product-description">${product.description}</p>
                ${product.rating ? `
                    <div class="product-rating">
                        <div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
                        <span class="rating-count">(${product.reviewCount || 0})</span>
                    </div>
                ` : ''}
                <div class="product-footer">
                    <div class="product-price-container">
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                        ${hasDiscount ? `<span class="product-price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get products by category
export function getProductsByCategory(category) {
    if (category === 'all') {
        return productsData;
    }
    return productsData.filter(product => product.category === category);
}

// Filter and sort products
export function filterAndSortProducts(category = 'all', sortBy = 'featured') {
    let products = getProductsByCategory(category);

    switch (sortBy) {
        case 'price-low':
            products = products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products = products.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            products = products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'featured':
        default:
            products = products.sort((a, b) => b.featured - a.featured);
            break;
    }

    return products;
}

// Search products
export function searchProducts(query) {
    const lowercaseQuery = query.toLowerCase();
    return productsData.filter(product =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
}

// Render products to container
export function renderProducts(containerId, category = 'all', sortBy = 'featured') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const products = filterAndSortProducts(category, sortBy);

    if (products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }

    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

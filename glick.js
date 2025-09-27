const firebaseConfig = {
      apiKey: "AIzaSyCYNhOoTmQF_18TsGnNj8Cy8gPuUYo60f0",
      authDomain: "modi-modi-6bec7.firebaseapp.com",
      projectId: "modi-modi-6bec7",
      storageBucket: "modi-modi-6bec7.firebasestorage.app",
      messagingSenderId: "240993739197",
      appId: "1:240993739197:web:852972b3b36a937e6ab2d4",
      measurementId: "G-N8NPV4L211"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    
    function copyText(id){
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById("toast");
        toast.textContent = "Copiato!";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
      });
    }

    let menuData = {
      categories: [],
      items: []
    };

    let currentCategoryId = null;
    const stickyHeader = document.getElementById("sticky-category-header");
    const menuSection = document.getElementById("menu-section");
    let unsubscribeMenu = null;

    function loadMenu(){
      unsubscribeMenu = db.collection("menu").doc("data").onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          menuData.categories = data.categories || [];
          menuData.items = data.items || [];
          
          let needsUpdate = false;
          menuData.items.forEach(item => {
            if (item.price !== undefined && item.price !== null) {
              if (item.priceGlass === undefined || item.priceGlass === null) {
                item.priceGlass = item.price;
                needsUpdate = true;
              }
              delete item.price;
              needsUpdate = true;
            }
          });
          
          if (needsUpdate) {
            db.collection("menu").doc("data").set(menuData);
          }
          
          renderMenu();
        } else {
          const defaultData = {
            categories: [],
            items: []
          };
          db.collection("menu").doc("data").set(defaultData);
          menuData = defaultData;
          renderMenu();
        }
      }, (error) => {
        console.error("Errore nel caricamento del menù:", error);
        document.getElementById("menu-items").innerHTML = 
          '<div class="menu-error"><i class="fas fa-exclamation-triangle"></i> Errore nel caricamento del menù</div>';
      });
    }

    function renderMenu() {
      const categoriesGrid = document.getElementById("menu-categories-grid");
      const items = document.getElementById("menu-items");
      categoriesGrid.innerHTML = "";
      
      menuData.categories.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        btn.textContent = c.name;
        btn.dataset.id = c.id;
        btn.onclick = () => filterMenu(c.id);
        categoriesGrid.appendChild(btn);
      });
      
      if (menuData.categories.length) {
        const firstBtn = categoriesGrid.querySelector(".category-btn");
        if (firstBtn) {
          firstBtn.classList.add("active");
          currentCategoryId = menuData.categories[0].id;
          filterMenu(currentCategoryId);
        }
      }
      
      menuSection.addEventListener('scroll', handleMenuScroll);
    }
    
    function handleMenuScroll() {
      const scrollTop = menuSection.scrollTop;
      
      if (scrollTop > 50) {
        stickyHeader.classList.remove("hidden");
      } else {
        stickyHeader.classList.add("hidden");
      }
    }

    function filterMenu(catId){
      const currentItems = document.querySelectorAll('.menu-item');
      currentItems.forEach(item => {
        item.classList.add('fade-out');
      });
      
      document.querySelectorAll(".category-btn").forEach(b => b.classList.toggle("active", b.dataset.id == catId));
      
      currentCategoryId = catId;
      const category = menuData.categories.find(c => c.id == catId);
      if (category) {
        stickyHeader.textContent = category.name;
      }
      
      setTimeout(() => {
        const container = document.getElementById("menu-items");
        container.scrollTop = 0;   // reset scroll to top

        const filtered = menuData.items.filter(i => i.categoryId == catId);
        
        if (!filtered.length) {
          container.innerHTML = '<div class="menu-error">Nessun elemento in questa categoria</div>';
          return;
        }
        
        container.innerHTML = "";
        filtered.forEach(i => {
          const itemElement = document.createElement("div");
          itemElement.className = "menu-item fade-out";
          
          let priceHTML = "";
          
          const hasBottlePrice = i.priceBottle !== null && i.priceBottle !== undefined;
          const hasGlassPrice = i.priceGlass !== null && i.priceGlass !== undefined;
          
          const hasSinglePrice = i.price !== null && i.price !== undefined;
          
          if (hasBottlePrice && hasGlassPrice) {
            priceHTML = `
              <div class="price-option">Bottiglia: €${i.priceBottle.toFixed(2)}</div>
              <div class="price-option">Calice: €${i.priceGlass.toFixed(2)}</div>
            `;
          } else if (hasBottlePrice) {
            priceHTML = `€${i.priceBottle.toFixed(2)}`;
          } else if (hasGlassPrice) {
            priceHTML = `€${i.priceGlass.toFixed(2)}`;
          } else if (hasSinglePrice) {
            priceHTML = `€${i.price.toFixed(2)}`;
          }
          
          itemElement.innerHTML = `
            ${i.image ? `<img src="${i.image}" class="item-image" alt="${i.name}">` : ""}
            <div class="item-content">
              <div class="item-header">
                <h3 class="item-name">${i.name}</h3>
              </div>
              <p class="item-desc">${i.description}</p>
              <div class="item-price">${priceHTML}</div>
            </div>
          `;
          container.appendChild(itemElement);
          
          setTimeout(() => {
            itemElement.classList.remove('fade-out');
            itemElement.classList.add('fade-in');
          }, 50);
        });
      }, 300);
    }
    
    document.addEventListener("DOMContentLoaded", loadMenu);
    
    window.addEventListener('beforeunload', () => {
      if (unsubscribeMenu) {
        unsubscribeMenu();
      }
    });
    function loadEventBanner() {
  db.collection("event").doc("current").onSnapshot(doc => {
    const banner = document.getElementById("event-banner");
    
    if (doc.exists) {
      const data = doc.data();
      const now = Date.now();

      if (data.expiry > now) {
        banner.textContent = data.text;
        banner.classList.remove("hidden");


        const timeUntilExpiry = data.expiry - now;
        setTimeout(() => {
          banner.classList.add("hidden");
        }, timeUntilExpiry);
      } else {
        banner.classList.add("hidden");
      }
    } else {
      banner.classList.add("hidden");
    }
  }, error => {
    console.error("Error loading event:", error);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  loadMenu();
  loadEventBanner();
});
let adminKeySequence = [];
const adminShortcut = ['Control', 'Alt', 'm'];

document.addEventListener('keydown', function(event) {
  adminKeySequence.push(event.key.toLowerCase());

  if (adminKeySequence.length > 3) {
    adminKeySequence.shift();
  }
  
  if (adminKeySequence.length === 3) {
    const sequenceString = adminKeySequence.join('');
    const shortcutString = adminShortcut.join('').toLowerCase();
    
    if (sequenceString === shortcutString) {
      window.open('admin.html', '_blank');
      
      adminKeySequence = [];
    }
  }
});

let sequenceTimeout;
document.addEventListener('keydown', function() {
  clearTimeout(sequenceTimeout);
  sequenceTimeout = setTimeout(() => {
    adminKeySequence = [];
  }, 2000);
});
// Advanced devtools detection
(function() {
  'use strict';
  
  const blocker = {
    init() {
      this.disableRightClick();
      this.disableKeyboardShortcuts();
      this.detectDevTools();
      this.detectConsole();
    },
    
    disableRightClick() {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    },
    
    disableKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12') {
          e.preventDefault();
          this.showWarning('Nice Try');
          return false;
        }
        
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
          e.preventDefault();
          this.showWarning('Nice Try');
          return false;
        }
        
        // Ctrl+U
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          this.showWarning('Nice Try');
          return false;
        }
      });
    },
    
    detectDevTools() {
      // Size-based detection
      const checkDevTools = () => {
        const threshold = 150;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        if (widthDiff > threshold || heightDiff > threshold) {
          this.handleViolation();
        }
      };
      
      setInterval(checkDevTools, 1000);
    },
    
    detectConsole() {
      // Override console methods
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
      };
      
      ['log', 'warn', 'error', 'info'].forEach(method => {
        console[method] = function() {
          originalConsole[method].apply(console, arguments);
          blocker.handleViolation();
        };
      });
    },
    
    showWarning(message) {
      // Create a subtle warning notification
      const warning = document.createElement('div');
      warning.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #c15757;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial;
        font-size: 14px;
      `;
      warning.textContent = message;
      document.body.appendChild(warning);
      
      setTimeout(() => {
        if (document.body.contains(warning)) {
          document.body.removeChild(warning);
        }
      }, 2000);
    },
    
    handleViolation() {
      // Redirect to home or show blocking page
      if (!window.devtoolsBlocked) {
        window.devtoolsBlocked = true;
        
        // Clear the page
        document.body.innerHTML = `
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            text-align: center;
            padding: 20px;
          ">
            <div>
              <h1 style="color: var(--accent); margin-bottom: 20px;">
                <i class="fas fa-ban"></i> Access Restricted
              </h1>
              <p style="margin-bottom: 15px; line-height: 1.5;">
                Developer tools are not permitted on this page.<br>
                Please close any open developer tools and refresh the page.
              </p>
              <button onclick="location.reload()" style="
                background: var(--accent);
                color: var(--bg);
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
              ">
                Reload Page
              </button>
            </div>
          </div>
        `;
        
        // Disable all interactions
        document.addEventListener('keydown', (e) => e.preventDefault());
        document.addEventListener('click', (e) => e.preventDefault());
        document.addEventListener('contextmenu', (e) => e.preventDefault());
      }
    }
  };
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => blocker.init());
  } else {
    blocker.init();
  }
})();
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
const auth = firebase.auth();

const modal = document.getElementById("modal");
const confirmModal = document.getElementById("confirmModal");
const confirmText = document.getElementById("confirmText");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
let confirmCallback = null;

function showModal(message, type="success") {
  modal.textContent = message;
  modal.className = `modal show ${type}`;
  setTimeout(()=>{ modal.classList.remove("show"); }, 2000);
}

function showConfirm(message, callback) {
  confirmText.textContent = message;
  confirmModal.classList.add("show");
  confirmCallback = callback;
}
confirmYes.onclick = ()=>{ confirmModal.classList.remove("show"); if(confirmCallback) confirmCallback(true); confirmCallback=null; };
confirmNo.onclick = ()=>{ confirmModal.classList.remove("show"); if(confirmCallback) confirmCallback(false); confirmCallback=null; };

// Your UID for authentication
const ADMIN_UID = "60EdjBt6uaROes2PLOwfxWmcL2h2";
const ADMIN_EMAIL = "pirtskhalaishvilizura5@gmail.com";
const ADMIN_PASSWORD = "adminzura";

let menuData = {
  categories: [],
  items: []
};
let editingItemId=null;
let editingCategoryId=null;
let cloningItemId=null;
let unsubscribeMenu = null;

let verificationCode = null;
let verificationCodeExpiry = null;
let resendTimer = null;

async function checkLogin() {
  const username = document.getElementById("admin-user").value.trim();
  const password = document.getElementById("admin-pass").value.trim();
  const email = document.getElementById("admin-email").value.trim();

  // Basic validation
  if (!username || !password || !email) {
    showModal("გთხოვთ შეავსოთ ყველა ველი", "error");
    return;
  }

  if (!validateEmail(email)) {
    showModal("გთხოვთ შეიყვანოთ სწორი ელ. ფოსტა", "error");
    return;
  }

  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  document.getElementById("loader-text").textContent = "მიმდინარეობს ავტორიზაცია...";

  try {
    // Check credentials first
    if (username === "admin" && password === ADMIN_PASSWORD && email === ADMIN_EMAIL) {
      // Authenticate with Firebase using UID-based approach
      await firebaseAuthLogin(email, password);
    } else {
      loader.classList.add("hidden");
      showModal("არასწორი მომხმარებელი, პაროლი ან ელ. ფოსტა", "error");
    }
    
  } catch (error) {
    loader.classList.add("hidden");
    console.error("Authentication error:", error);
    showModal("შეცდომა ავტორიზაციის დროს", "error");
  }
}

// Firebase authentication function
async function firebaseAuthLogin(email, password) {
  try {
    // Sign in with email and password
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log("Logged in user UID:", user.uid);
    
    // Verify this is the correct UID
    if (user.uid === ADMIN_UID) {
      // Send verification code
      const success = await sendVerificationCode(email);
      document.getElementById("loader").classList.add("hidden");
      
      if (success) {
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("verification-section").classList.remove("hidden");
        startResendTimer();
        focusFirstVerificationInput();
      }
    } else {
      // UID doesn't match - sign out and show error
      await auth.signOut();
      document.getElementById("loader").classList.add("hidden");
      showModal("არასწორი უფლებები", "error");
    }
    
  } catch (error) {
    console.error("Firebase auth error:", error);
    document.getElementById("loader").classList.add("hidden");
    
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      showModal("არასწორი ელ. ფოსტა ან პაროლი", "error");
    } else {
      showModal("ავტორიზაციის შეცდომა: " + error.message, "error");
    }
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function sendVerificationCode(email) {
  try {
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodeExpiry = Date.now() + 10 * 60 * 1000;
    
    console.log("Sending verification code to:", email);
    console.log("Verification code:", verificationCode);

    const templateParams = {
      email: email,
      from_name: "Modi & Modi Admin",
      code: verificationCode,
      subject: "Your Verification Code"
    };

    const res = await emailjs.send(
      "service_snpy3xh",
      "template_n63skw8",
      templateParams
    );

    console.log("EmailJS response:", res);
    showModal("ვერიფიკაციის კოდი გამოგზავნილია!", "success");
    return true;
    
  } catch (error) {
    console.error("Error sending code:", error);
    showModal("ელ. ფოსტის გაგზავნა ვერ მოხერხდა: " + error.text, "error");
    return false;
  }
}

async function resendVerificationCode() {
  const email = document.getElementById("admin-email").value.trim();
  
  if (resendTimer) {
    showModal("გთხოვთ დაიცადოთ სანამ კოდის ხელახლა გაგზავნა შესაძლებელი გახდება", "error");
    return;
  }
  
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  document.getElementById("loader-text").textContent = "კოდის გაგზავნა...";
  
  try {
    const success = await sendVerificationCode(email);
    loader.classList.add("hidden");
    
    if (success) {
      showModal("ახალი კოდი გამოგზავნილია!", "success");
      startResendTimer();
      setupVerificationInputs();
      focusFirstVerificationInput();
    }
  } catch (error) {
    loader.classList.add("hidden");
    console.error("Error resending code:", error);
    showModal("კოდის გაგზავნის შეცდომა", "error");
  }
}

function setupVerificationInputs() {
  const inputs = document.querySelectorAll('.verification-input');
  inputs.forEach((input, index) => {
    input.value = '';
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

function moveToNext(input, nextIndex) {
  if (input.value.length === 1) {
    const inputs = document.querySelectorAll('.verification-input');
    if (nextIndex < inputs.length) {
      inputs[nextIndex].focus();
    }
  }
}

function handleVerificationInput(event, index) {
  if (event.key === 'Backspace') {
    const currentInput = document.querySelector(`.verification-input:nth-child(${index + 1})`);
    if (currentInput && currentInput.value === '') {
      if (index > 0) {
        const prevInput = document.querySelector(`.verification-input:nth-child(${index})`);
        if (prevInput) prevInput.focus();
      }
    }
  }
}

function focusFirstVerificationInput() {
  const firstInput = document.querySelector('.verification-input:nth-child(1)');
  if (firstInput) firstInput.focus();
}

function getVerificationCode() {
  const inputs = document.querySelectorAll('.verification-input');
  let code = '';
  inputs.forEach(input => {
    code += input.value;
  });
  return code;
}

function verifyCode() {
  const enteredCode = getVerificationCode();
  const currentTime = Date.now();
  
  if (enteredCode.length !== 6) {
    showModal("გთხოვთ შეიყვანოთ სრული 6-ნიშნა კოდი", "error");
    return;
  }
  
  if (currentTime > verificationCodeExpiry) {
    showModal("ვერიფიკაციის კოდი ვადაგასულია. გთხოვთ მოითხოვოთ ახალი კოდი", "error");
    return;
  }
  
  if (enteredCode === verificationCode) {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    document.getElementById("loader-text").textContent = "მიმდინარეობს შესვლა...";
    
    setTimeout(() => {
      loader.classList.add("hidden");
      document.getElementById("verification-section").classList.add("hidden");
      document.getElementById("admin-panel").classList.remove("hidden");
      
      showWelcomeMessage();
      loadMenuData();
      
      const inputs = document.querySelectorAll('.verification-input');
      inputs.forEach(input => input.value = '');
    }, 1500);
  } else {
    showModal("არასწორი ვერიფიკაციის კოდი", "error");
  }
}

function startResendTimer() {
  clearInterval(resendTimer);
  
  let timeLeft = 60;
  const timerElement = document.getElementById("resend-timer");
  const resendLink = document.querySelector(".verification-resend a");
  
  resendLink.style.pointerEvents = "none";
  resendLink.style.opacity = "0.5";
  
  timerElement.textContent = `კოდის ხელახლა გაგზავნა შესაძლებელი იქნება ${timeLeft} წამში`;
  
  resendTimer = setInterval(() => {
    timeLeft--;
    
    if (timeLeft <= 0) {
      clearInterval(resendTimer);
      resendTimer = null;
      timerElement.textContent = "";
      
      resendLink.style.pointerEvents = "auto";
      resendLink.style.opacity = "1";
    } else {
      timerElement.textContent = `კოდის ხელახლა გაგზავნა შესაძლებელი იქნება ${timeLeft} წამში`;
    }
  }, 1000);
}

function goBackToLogin() {
  document.getElementById("verification-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  
  const inputs = document.querySelectorAll('.verification-input');
  inputs.forEach(input => input.value = '');
  
  clearInterval(resendTimer);
  resendTimer = null;
  document.getElementById("resend-timer").textContent = "";
  
  // Sign out from Firebase when going back
  auth.signOut();
}

function showWelcomeMessage() {
  showModal("მოგესალმები!", "success");
  
  const title = document.querySelector("#admin-panel h2");
  if (title) {
    const originalTitle = title.innerHTML;
    title.innerHTML = `<span style="color: var(--accent);  display: block; margin-top: 5px;">სამართავი პანელი</span>`;
    
    setTimeout(() => {
      title.innerHTML = "სამართავი პანელი";
    }, 5000);
  }
}

function logout() {
  auth.signOut().then(() => {
    clearEditState();
    document.querySelector("#admin-panel h2").innerHTML = "სამართავი პანელი";
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("admin-panel").classList.add("hidden");
    document.getElementById("admin-email").value = "";
    document.getElementById("admin-pass").value = "";
    
    if (unsubscribeMenu) {
      unsubscribeMenu();
    }
  });
}

function loadMenuData() {
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
        db.collection("menu").doc("data").set(menuData)
          .then(() => {
            loadCategories(); 
            loadItemsByCategory(); 
            loadCategoryList();
          })
          .catch((error) => {
            console.error("Error updating menu structure:", error);
            loadCategories(); 
            loadItemsByCategory(); 
            loadCategoryList();
          });
      } else {
        loadCategories(); 
        loadItemsByCategory(); 
        loadCategoryList();
      }
    } else {
      const defaultData = {
        categories: [],
        items: []
      };
      db.collection("menu").doc("data").set(defaultData)
        .then(() => {
          menuData = defaultData;
          loadCategories(); 
          loadItemsByCategory(); 
          loadCategoryList();
        })
        .catch((error) => {
          console.error("Error creating default menu data:", error);
          menuData = defaultData;
          loadCategories(); 
          loadItemsByCategory(); 
          loadCategoryList();
        });
    }
  }, (error) => {
    console.error("Error loading menu data:", error);
    showModal("მენიუს მონაცემების ჩატვირთვის შეცდომა", "error");
  });
}

function switchTab(tabName){
  clearEditState();

  document.querySelectorAll('.tab').forEach(tab=>tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));

  if (tabName === 'menu') {
    document.querySelector('.tab:nth-child(1)').classList.add('active');
    document.getElementById('menu-tab').classList.add('active');
  } else if (tabName === 'categories') {
    document.querySelector('.tab:nth-child(2)').classList.add('active');
    document.getElementById('categories-tab').classList.add('active');
  } else if (tabName === 'events') {
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    document.getElementById('events-tab').classList.add('active');
  }
}

function loadCategories(){
  const sel=document.getElementById("item-category");
  sel.innerHTML="";
  menuData.categories.forEach(c=>{
    const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; sel.appendChild(opt);
  });
}

function loadCategoryList(){
  const list=document.getElementById("category-list"); list.innerHTML="";
  if(menuData.categories.length===0){ list.innerHTML='<div class="empty-state">ჯერ არ არის კატეგორიები</div>'; return; }
  
  menuData.categories.forEach((c, index) => {
    const categoryItem=document.createElement("div");
    categoryItem.className="category-item";
    categoryItem.innerHTML=`
      <div class="category-item-content">
        <div class="order-buttons">
          <button class="order-btn" onclick="moveCategoryUp(${c.id})" ${index === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-up"></i>
          </button>
          <button class="order-btn" onclick="moveCategoryDown(${c.id})" ${index === menuData.categories.length - 1 ? 'disabled' : ''}>
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
        <div>${c.name}</div>
      </div>
      <div class="item-actions">
        <button onclick="editCategory(${c.id})">რედაქტირება</button>
        <button class="danger" onclick="deleteCategory(${c.id})">წაშლა</button>
      </div>`;
    list.appendChild(categoryItem);
  });
}

async function moveCategoryUp(categoryId) {
  const index = menuData.categories.findIndex(c => c.id === categoryId);
  if (index <= 0) return;
  
  [menuData.categories[index], menuData.categories[index - 1]] = 
  [menuData.categories[index - 1], menuData.categories[index]];
  
  try {
    await db.collection("menu").doc("data").set(menuData);
    loadCategoryList();
    loadCategories();
    showModal("კატეგორიის თანმიმდევრობა განახლდა", "success");
  } catch (error) {
    console.error("Error moving category:", error);
    showModal("კატეგორიის გადაადგილების შეცდომა", "error");
  }
}

async function moveCategoryDown(categoryId) {
  const index = menuData.categories.findIndex(c => c.id === categoryId);
  if (index === -1 || index >= menuData.categories.length - 1) return;
  
  [menuData.categories[index], menuData.categories[index + 1]] = 
  [menuData.categories[index + 1], menuData.categories[index]];
  
  try {
    await db.collection("menu").doc("data").set(menuData);
    loadCategoryList();
    loadCategories();
    showModal("კატეგორიის თანმიმდევრობა განახლდა", "success");
  } catch (error) {
    console.error("Error moving category:", error);
    showModal("კატეგორიის გადაადგილების შეცდომა", "error");
  }
}

async function addCategory(){
  const name = document.getElementById("category-name").value.trim();
  
  if(!name) return showModal("გთხოვთ შეიყვანოთ კატეგორიის სახელი","error");
  
  try {
    const categoryButton = document.querySelector("#categories-tab button");
    
    if(editingCategoryId){
      const category = menuData.categories.find(c => c.id === editingCategoryId);
      if(category) {
        category.name = name;
      }
      showModal("კატეგორია განახლდა!","success"); 
      editingCategoryId = null;
      
      categoryButton.textContent = "კატეგორიის დამატება";
      categoryButton.removeAttribute("data-editing");
    } else {
      if (!menuData.categories) {
        menuData.categories = [];
      }
      
      const newId = menuData.categories.length > 0 ? Math.max(...menuData.categories.map(c => c.id)) + 1 : 1;
      menuData.categories.push({
        id: newId,
        name: name,
        order: menuData.categories.length
      }); 
      showModal("კატეგორია დაემატა!","success");
    }
    
    await db.collection("menu").doc("data").set(menuData);
    
    loadCategories(); 
    loadCategoryList();
    document.getElementById("category-name").value = "";
  } catch (error) {
    console.error("Error saving category:", error);
    showModal("კატეგორიის შენახვის შეცდომა", "error");
  }
}

function editCategory(id){
  const category=menuData.categories.find(c=>c.id===id); if(!category) return;
  document.getElementById("category-name").value=category.name; 
  editingCategoryId=id;
  
  const categoryButton = document.querySelector("#categories-tab button");
  categoryButton.textContent = "ცვლილებების შენახვა";
  categoryButton.dataset.editing = "true";
  
  document.getElementById("category-name").focus();
}

async function deleteCategory(id){
  showConfirm("დარწმუნებული ხარ, რომ გსურს ამ კატეგორიის წაშლა? ამ კატეგორიაში არსებული ყველა მონაცემიც წაიშლება.", async confirmed=>{
    if(!confirmed) return;
    
    try {
      menuData.items = menuData.items.filter(i => i.categoryId !== id);
      
      menuData.categories = menuData.categories.filter(c => c.id !== id);
      
      await db.collection("menu").doc("data").set(menuData);
      
      loadCategories(); 
      loadCategoryList();
      showModal("კატეგორია და მისი მონაცემები წაიშალა!","success");
    } catch (error) {
      console.error("Error deleting category:", error);
      showModal("კატეგორიის წაშლის შეცდომა", "error");
    }
  });
}

function toggleBottlePrice() {
  const bottleGroup = document.getElementById("bottle-price-group");
  const toggleBtn = document.getElementById("bottle-price-toggle");
  
  if (bottleGroup.classList.contains("hidden")) {
    bottleGroup.classList.remove("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-minus"></i> ბოთლის ფასი';
    toggleBtn.classList.add("active");
  } else {
    bottleGroup.classList.add("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-plus"></i> ბოთლის ფასი';
    toggleBtn.classList.remove("active");
    document.getElementById("item-price-bottle").value = "";
  }
}

function adjustBottlePrice(amount) {
  const priceInput = document.getElementById("item-price-bottle");
  let currentPrice = parseFloat(priceInput.value) || 0;
  currentPrice += amount;
  
  if (currentPrice < 0) currentPrice = 0;
  
  priceInput.value = Math.round(currentPrice * 100) / 100;
}

function adjustGlassPrice(amount) {
  const priceInput = document.getElementById("item-price-glass");
  let currentPrice = parseFloat(priceInput.value) || 0;
  currentPrice += amount;
  
  if (currentPrice < 0) currentPrice = 0;
  
  priceInput.value = Math.round(currentPrice * 100) / 100;
}

async function addMenuItem(){
  const categoryId = parseInt(document.getElementById("item-category").value);
  const name = document.getElementById("item-name").value.trim();
  const description = document.getElementById("item-desc").value.trim();
  const priceGlass = parseFloat(document.getElementById("item-price-glass").value);
  const priceBottleInput = document.getElementById("item-price-bottle");
  const priceBottle = priceBottleInput.value ? parseFloat(priceBottleInput.value) : null;
  const image = document.getElementById("item-image").value.trim();
  
  if(!name || isNaN(priceGlass)) return showModal("გთხოვთ შეავსოთ სახელი და ფასი","error");
  
  try {
    const itemButton = document.querySelector("#menu-tab button");
    
    if(editingItemId){
      const item=menuData.items.find(i=>i.id===editingItemId);
      if(item){
        item.categoryId=categoryId;
        item.name=name;
        item.description=description || "";
        item.priceGlass = isNaN(priceGlass) ? null : priceGlass;
        item.priceBottle = isNaN(priceBottle) ? null : priceBottle;
        
        if (item.price !== undefined) {
          delete item.price;
        }
        
        item.image=image || "";
      }
      showModal("პოზიცია განახლდა!","success"); 
      editingItemId=null;
      cloningItemId=null;
      
      itemButton.textContent = "დამატება";
      itemButton.removeAttribute("data-editing");
      document.getElementById("editing-category-indicator").classList.add("hidden");
      document.getElementById("clone-indicator").classList.add("hidden");
    } else {
      const newId=menuData.items.length>0?Math.max(...menuData.items.map(i=>i.id))+1:1;
      menuData.items.push({
        id:newId,
        categoryId,
        name,
        description: description || "",
        priceGlass: isNaN(priceGlass) ? null : priceGlass,
        priceBottle: isNaN(priceBottle) ? null : priceBottle,
        image: image || ""
      }); 
      showModal("დაემატა!","success");
      
      if (cloningItemId) {
        cloningItemId = null;
        document.getElementById("clone-indicator").classList.add("hidden");
      }
    }
    
    await db.collection("menu").doc("data").set(menuData);
    
    loadItemsByCategory();
    document.getElementById("item-name").value="";
    document.getElementById("item-desc").value="";
    document.getElementById("item-price-glass").value="";
    document.getElementById("item-price-bottle").value="";
    document.getElementById("item-image").value="";
    
    document.getElementById("bottle-price-group").classList.add("hidden");
    document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-plus"></i> ბოთლის ფასი';
    document.getElementById("bottle-price-toggle").classList.remove("active");
  } catch (error) {
    console.error("Error saving menu item:", error);
    showModal("მენიუს შენახვის შეცდომა", "error");
  }
}

function loadItemsByCategory(){
  const container=document.getElementById("items-by-category"); container.innerHTML="";
  if(menuData.items.length===0){ container.innerHTML='<div class="empty-state">ჯერ არ არის მენიუ</div>'; return; }
  
  const sortedCategories = [...menuData.categories];
  if (sortedCategories[0] && sortedCategories[0].order !== undefined) {
    sortedCategories.sort((a, b) => a.order - b.order);
  }
  
  sortedCategories.forEach(c=>{
    const itemsInCategory=menuData.items.filter(i=>i.categoryId===c.id);
    if(itemsInCategory.length===0) return;
    
    const categorySection=document.createElement("div"); categorySection.className="category-section";
    categorySection.innerHTML=`<div class="category-header">${c.name}</div><div class="item-list" id="category-${c.id}"></div>`;
    container.appendChild(categorySection);
    
    const itemList=document.getElementById(`category-${c.id}`);
    itemsInCategory.forEach(i=>{
      let priceText = "";
      
      const hasBottlePrice = i.priceBottle !== null && i.priceBottle !== undefined;
      const hasGlassPrice = i.priceGlass !== null && i.priceGlass !== undefined;
      
      const hasSinglePrice = i.price !== null && i.price !== undefined;
      
      if (hasBottlePrice && hasGlassPrice) {
        priceText = `Bottle: €${i.priceBottle.toFixed(2)} Glass: €${i.priceGlass.toFixed(2)}`;
      } else if (hasBottlePrice) {
        priceText = `€${i.priceBottle.toFixed(2)}`;
      } else if (hasGlassPrice) {
        priceText = `€${i.priceGlass.toFixed(2)}`;
      } else if (hasSinglePrice) {
        priceText = `€${i.price.toFixed(2)}`;
      }
      
      const itemCard=document.createElement("div"); itemCard.className="item-card";
      itemCard.innerHTML=`<div class="item-info">
        <div class="item-name">${i.name}</div>
        <div class="item-details">${i.description || "(აღწერა არ არის)"} - ${priceText}</div>
      </div>
      <div class="item-actions">
        <button title="რედაქტირება" onclick="editItem(${i.id})"><i class="fas fa-edit"></i></button>
        <button class="info" title="კლონი" onclick="cloneItem(${i.id})"><i class="fas fa-copy"></i></button>
        <button class="danger" title="წაშლა" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button>
      </div>`;
      itemList.appendChild(itemCard);
    });
  });
}

function editItem(id){
  const item=menuData.items.find(i=>i.id===id); 
  if(!item) return;
  
  document.getElementById("item-category").value=item.categoryId;
  document.getElementById("item-name").value=item.name;
  document.getElementById("item-desc").value=item.description || "";
  
  if (item.priceGlass !== undefined && item.priceGlass !== null) {
    document.getElementById("item-price-glass").value=item.priceGlass;
  } else if (item.price !== undefined && item.price !== null) {
    document.getElementById("item-price-glass").value=item.price;
  } else {
    document.getElementById("item-price-glass").value="";
  }
  
  if (item.priceBottle) {
    document.getElementById("item-price-bottle").value = item.priceBottle;
    document.getElementById("bottle-price-group").classList.remove("hidden");
    document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-minus"></i> ბოთლის ფასი';
    document.getElementById("bottle-price-toggle").classList.add("active");
  } else {
    document.getElementById("item-price-bottle").value = "";
    document.getElementById("bottle-price-group").classList.add("hidden");
    document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-plus"></i> ბოთლის ფასი';
    document.getElementById("bottle-price-toggle").classList.remove("active");
  }
  
  document.getElementById("item-image").value=item.image || "";
  editingItemId=id;
  cloningItemId=null;
  
  const category = menuData.categories.find(c => c.id === item.categoryId);
  if(category) {
    document.getElementById("current-category-name").textContent = category.name;
    document.getElementById("editing-category-indicator").classList.remove("hidden");
  }
  
  document.getElementById("clone-indicator").classList.add("hidden");
  
  const itemButton = document.querySelector("#menu-tab button");
  itemButton.textContent = "ცვლილებების შენახვა";
  itemButton.dataset.editing = "true";
  
  document.getElementById("item-name").focus();
}

function cloneItem(id){
  const item=menuData.items.find(i=>i.id===id); 
  if(!item) return;
  
  document.getElementById("item-category").value=item.categoryId;
  document.getElementById("item-name").value=item.name + " (კოპირებული)";
  document.getElementById("item-desc").value=item.description || "";
  document.getElementById("item-price-glass").value=item.priceGlass || "";
  
  if (item.priceBottle) {
    document.getElementById("item-price-bottle").value = item.priceBottle;
    document.getElementById("bottle-price-group").classList.remove("hidden");
    document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-minus"></i> ბოთლის ფასი';
    document.getElementById("bottle-price-toggle").classList.add("active");
  } else {
    document.getElementById("item-price-bottle").value = "";
    document.getElementById("bottle-price-group").classList.add("hidden");
    document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-plus"></i> ბოთლის ფასი';
    document.getElementById("bottle-price-toggle").classList.remove("active");
  }
  
  document.getElementById("item-image").value=item.image || "";
  cloningItemId=id;
  editingItemId=null;
  
  document.getElementById("editing-category-indicator").classList.add("hidden");
  
  document.getElementById("cloned-item-name").textContent = item.name;
  document.getElementById("clone-indicator").classList.remove("hidden");
  
  const itemButton = document.querySelector("#menu-tab button");
  itemButton.textContent = "დამატება";
  itemButton.removeAttribute("data-editing");
  
  document.getElementById("item-name").focus();
}

function clearClone() {
  cloningItemId = null;
  document.getElementById("clone-indicator").classList.add("hidden");
  clearEditState();
}

async function deleteItem(id){
  showConfirm("დარწმუნებული ხარ, რომ გსურს წაშლა?", async confirmed=>{
    if(!confirmed) return;
    
    try {
      menuData.items=menuData.items.filter(i=>i.id!==id);
      await db.collection("menu").doc("data").set(menuData);
      
      loadItemsByCategory();
      showModal("წაიშალა!","success");
    } catch (error) {
      console.error("Error deleting item:", error);
      showModal("წაშლის შეცდომა", "error");
    }
  });
}

function searchItems(){
  const searchTerm=document.getElementById("search-input").value.toLowerCase();
  if(!searchTerm) return loadItemsByCategory();
  
  const container=document.getElementById("items-by-category"); container.innerHTML="";
  const filteredItems=menuData.items.filter(i=>
    i.name.toLowerCase().includes(searchTerm) || 
    (i.description && i.description.toLowerCase().includes(searchTerm))
  );
  if(filteredItems.length===0){ container.innerHTML='<div class="empty-state">შესაბამისი მონაცემები ვერ მოიძებნა</div>'; return; }
  
  const searchSection=document.createElement("div"); searchSection.className="category-section";
  searchSection.innerHTML=`<div class="category-header">ძებნის შედეგები</div><div class="item-list"></div>`;
  container.appendChild(searchSection);
  
  const itemList=searchSection.querySelector(".item-list");
  filteredItems.forEach(i=>{
    const category=menuData.categories.find(c=>c.id===i.categoryId);
    const highlightedName=i.name.replace(new RegExp(searchTerm,'gi'),match=>`<span class="search-highlight">${match}</span>`);
    const description = i.description || "(აღწერა არ არის)";
    const highlightedDesc=description.replace(new RegExp(searchTerm,'gi'),match=>`<span class="search-highlight">${match}</span>`);
    
    let priceText = "";
    if (i.priceBottle && i.priceGlass) {
      priceText = `Bottle: €${i.priceBottle.toFixed(2)} Glass: €${i.priceGlass.toFixed(2)}`;
    } else if (i.priceBottle) {
      priceText = `€${i.priceBottle.toFixed(2)}`;
    } else if (i.priceGlass) {
      priceText = `€${i.priceGlass.toFixed(2)}`;
    } else if (i.price) {
      priceText = `€${i.price.toFixed(2)}`;
    }
    
    const itemCard=document.createElement("div"); itemCard.className="item-card";
    itemCard.innerHTML=`<div class="item-info">
      <div class="item-name">${highlightedName} <span class="item-category-badge">${category?category.name:"უკატეგორიო"}</span></div>
      <div class="item-details">${highlightedDesc} - ${priceText}</div>
    </div>
    <div class="item-actions">
      <button title="რედაქტირება" onclick="editItem(${i.id})"><i class="fas fa-edit"></i></button>
      <button class="info" title="კლონი" onclick="cloneItem(${i.id})"><i class="fas fa-copy"></i></button>
      <button class="danger" title="წაშლა" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button>
    </div>`;
    itemList.appendChild(itemCard);
  });
}

function clearEditState(){
  editingItemId=null;
  editingCategoryId=null;
  cloningItemId=null;
  
  document.getElementById("item-name").value="";
  document.getElementById("item-desc").value="";
  document.getElementById("item-price-glass").value="";
  document.getElementById("item-price-bottle").value="";
  document.getElementById("item-image").value="";
  document.getElementById("category-name").value="";
  
  document.getElementById("bottle-price-group").classList.add("hidden");
  document.getElementById("bottle-price-toggle").innerHTML = '<i class="fas fa-plus"></i> ბოთლის ფასი';
  document.getElementById("bottle-price-toggle").classList.remove("active");
  
  document.getElementById("editing-category-indicator").classList.add("hidden");
  document.getElementById("clone-indicator").classList.add("hidden");
  
  const itemButton = document.querySelector("#menu-tab button");
  const categoryButton = document.querySelector("#categories-tab button");
  
  itemButton.textContent = "დამატება";
  itemButton.removeAttribute("data-editing");
  
  categoryButton.textContent = "კატეგორიის დამატება";
  categoryButton.removeAttribute("data-editing");
}

function clearSearch(){
  document.getElementById("search-input").value="";
  loadItemsByCategory();
}

// Event management functions
let events = [];
let editingEventId = null;

function loadEvents() {
  db.collection("event").get().then((querySnapshot) => {
    events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    renderEvents();
  }).catch((error) => {
    console.error("Error loading events:", error);
    showModal("ივენთების ჩატვირთვის შეცდომა", "error");
  });
}

function renderEvents() {
  const container = document.getElementById("events-list");
  container.innerHTML = "";
  
  if (events.length === 0) {
    container.innerHTML = '<div class="empty-state">ჯერ არ არის ივენთები</div>';
    return;
  }
  
  events.forEach(event => {
    const eventCard = document.createElement("div");
    eventCard.className = "event-card";
    eventCard.innerHTML = `
      <div class="event-info">
        <div class="event-name">${event.name}</div>
        <div class="event-date">${formatEventDate(event.date)}</div>
        <div class="event-description">${event.description || "(აღწერა არ არის)"}</div>
      </div>
      <div class="event-actions">
        <button onclick="editEvent('${event.id}')">რედაქტირება</button>
        <button class="danger" onclick="deleteEvent('${event.id}')">წაშლა</button>
      </div>
    `;
    container.appendChild(eventCard);
  });
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ka-GE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function addEvent() {
  const name = document.getElementById("event-name").value.trim();
  const date = document.getElementById("event-date").value;
  const description = document.getElementById("event-desc").value.trim();
  
  if (!name || !date) {
    showModal("გთხოვთ შეავსოთ სახელი და თარიღი", "error");
    return;
  }
  
  try {
    const eventData = {
      name: name,
      date: date,
      description: description,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (editingEventId) {
      await db.collection("event").doc(editingEventId).update(eventData);
      showModal("ივენთი განახლდა!", "success");
      editingEventId = null;
      
      const eventButton = document.querySelector("#events-tab button");
      eventButton.textContent = "ივენთის დამატება";
      eventButton.removeAttribute("data-editing");
    } else {
      await db.collection("event").doc().set(eventData);
      showModal("ივენთი დაემატა!", "success");
    }
    
    document.getElementById("event-name").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("event-desc").value = "";
    
    loadEvents();
  } catch (error) {
    console.error("Error saving event:", error);
    showModal("ივენთის შენახვის შეცდომა", "error");
  }
}

function editEvent(eventId) {
  const event = events.find(e => e.id === eventId);
  if (!event) return;
  
  document.getElementById("event-name").value = event.name;
  document.getElementById("event-date").value = event.date;
  document.getElementById("event-desc").value = event.description || "";
  
  editingEventId = eventId;
  
  const eventButton = document.querySelector("#events-tab button");
  eventButton.textContent = "ცვლილებების შენახვა";
  eventButton.dataset.editing = "true";
  
  document.getElementById("event-name").focus();
}

async function deleteEvent(eventId) {
  showConfirm("დარწმუნებული ხარ, რომ გსურს ამ ივენთის წაშლა?", async (confirmed) => {
    if (!confirmed) return;
    
    try {
      await db.collection("event").doc(eventId).delete();
      showModal("ივენთი წაიშალა!", "success");
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      showModal("ივენთის წაშლის შეცდომა", "error");
    }
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set up verification inputs
  setupVerificationInputs();
  
  // Set up enter key listeners for login
  document.getElementById("admin-pass").addEventListener("keypress", function(e) {
    if (e.key === "Enter") checkLogin();
  });
  
  // Set up enter key listeners for verification
  document.querySelectorAll('.verification-input').forEach((input, index) => {
    input.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        if (index === 5) {
          verifyCode();
        }
      }
    });
  });
  
  // Load events when events tab is clicked
  document.querySelector('.tab:nth-child(3)').addEventListener('click', function() {
    setTimeout(loadEvents, 100);
  });

});


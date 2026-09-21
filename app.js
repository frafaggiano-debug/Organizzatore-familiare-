/* =========================================================
   CASA FAMILIARE
   App principale
   ========================================================= */


/* =========================================================
   AUTENTICAZIONE SUPABASE
   ========================================================= */

async function initAuth() {

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Errore controllo sessione:", error);
    showLogin();
    return;
  }

  if (data.session) {
    // Utente già autenticato
    renderAll();
  } else {
    // Nessun utente autenticato
    showLogin();
  }
}


/* =========================================================
   SCHERMATA LOGIN
   ========================================================= */

function showLogin() {

  document.body.style.visibility = "visible";

  // Evita di creare due volte la schermata
  if (document.getElementById("authBox")) return;

  const authBox = document.createElement("div");

  authBox.id = "authBox";

  authBox.style.cssText = `
    position:fixed;
    inset:0;
    background:#f8f5f2;
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:99999;
    font-family:Arial,sans-serif;
  `;

  authBox.innerHTML = `
    <div style="
      width:min(90%,380px);
      background:white;
      padding:32px;
      border-radius:20px;
      box-shadow:0 8px 30px rgba(0,0,0,.10);
      text-align:center;
      box-sizing:border-box;
    ">

      <h1 style="
        margin-top:0;
        margin-bottom:8px;
      ">
        Casa Familiare
      </h1>

      <p style="
        color:#666;
        margin-bottom:22px;
      ">
        Accedi per entrare nell'app
      </p>

      <input
        id="authEmail"
        type="email"
        placeholder="Email"
        autocomplete="email"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:10px;
          font-size:15px;
        "
      >

      <input
        id="authPassword"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:10px;
          font-size:15px;
        "
      >

      <button
        id="authLogin"
        style="
          width:100%;
          padding:13px;
          margin-top:12px;
          border:0;
          border-radius:10px;
          background:#7ea8d8;
          color:white;
          font-size:16px;
          cursor:pointer;
        "
      >
        Accedi
      </button>

      <p
        id="authMessage"
        style="
          margin-top:15px;
          font-size:14px;
          min-height:20px;
        "
      ></p>

    </div>
  `;

  document.body.appendChild(authBox);

  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const loginButton = document.getElementById("authLogin");
  const message = document.getElementById("authMessage");

  async function login() {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      message.textContent = "Inserisci email e password.";
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Accesso in corso...";
    message.textContent = "";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {

      console.error("Errore login:", error);

      message.textContent =
        "Email o password non corrette.";

      loginButton.disabled = false;
      loginButton.textContent = "Accedi";

      return;
    }

    authBox.remove();

    renderAll();
  }

  loginButton.addEventListener("click", login);

  passwordInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      login();
    }
  });

  emailInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      login();
    }
  });
}


/* =========================================================
   PERSONE DELLA FAMIGLIA
   ========================================================= */

const PEOPLE = {
  francesca: {
    name: "Francesca",
    color: "#e98b96"
  },

  alessio: {
    name: "Alessio",
    color: "#7ea8d8"
  },

  sara: {
    name: "Sara",
    color: "#e99bc1"
  },

  vera: {
    name: "Vera",
    color: "#82bd96"
  },

  famiglia: {
    name: "Famiglia",
    color: "#aa8bc9"
  }
};


/* =========================================================
   COSTANTI
   ========================================================= */

const SHOP_CATS = [
  "dispensa",
  "frutta e verdura",
  "banco frigo",
  "surgelati",
  "farmaci",
  "detersivi",
  "macelleria",
  "salumeria",
  "pescheria"
];

const DAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica"
];

const FMEALS = [
  "Colazione",
  "Spuntino",
  "Pranzo",
  "Merenda",
  "Cena"
];

const FKEY = [
  "colazione",
  "spuntino",
  "pranzo",
  "merenda",
  "cena"
];

const AKEY = [
  "pranzo",
  "cena"
];


/* =========================================================
   STATO APP
   ========================================================= */

const KEY = "casa_familiare_v1";

let state =
  JSON.parse(localStorage.getItem(KEY) || "null")
  ||
  {
    menus: {},
    shopping: {},
    events: [],
    notes: [],
    recipes: []
  };

let currentHouseholdId = null;

let menuOffset = 0;
let shopOffset = 0;
let calDate = new Date();


/* =========================================================
   SALVATAGGIO LOCALE
   ========================================================= */

const save = () => {
  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );
};


/* =========================================================
   FUNZIONI DATE
   ========================================================= */

const iso = d =>
  d.toISOString().slice(0, 10);


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

  const el = document.getElementById("home");

  if (!el) return;

  el.innerHTML = `
    <div class="home-grid">

      <button class="home-card" data-go="menu">
        <div class="home-icon">🍽️</div>
        <div class="home-title">Menu settimanale</div>
        <div class="home-text">
          Organizza i pasti della famiglia
        </div>
      </button>

      <button class="home-card" data-go="shopping">
        <div class="home-icon">🛒</div>
        <div class="home-title">Lista della spesa</div>
        <div class="home-text">
          Tutto quello che serve
        </div>
      </button>

      <button class="home-card" data-go="calendar">
        <div class="home-icon">📅</div>
        <div class="home-title">Calendario</div>
        <div class="home-text">
          Impegni e appuntamenti
        </div>
      </button>

      <button class="home-card" data-go="notes">
        <div class="home-icon">📝</div>
        <div class="home-title">Note</div>
        <div class="home-text">
          Idee e promemoria
        </div>
      </button>

      <button class="home-card" data-go="recipes">
        <div class="home-icon">📖</div>
        <div class="home-title">Ricette</div>
        <div class="home-text">
          Le ricette della famiglia
        </div>
      </button>

    </div>
  `;

  el.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

      const target = button.dataset.go;

      document
        .querySelectorAll(".page")
        .forEach(page => page.classList.remove("active"));

      const page = document.getElementById(target);

      if (page) {
        page.classList.add("active");
      }

    });

  });
}


/* =========================================================
   MENU
   ========================================================= */

function renderMenu() {

  const el = document.getElementById("menu");

  if (!el) return;

  const today = new Date();

  const monday = new Date(today);

  const day = monday.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  monday.setDate(monday.getDate() + diff);

  monday.setDate(
    monday.getDate() + menuOffset * 7
  );

  let html = `
    <div class="section-header">

      <button id="menuPrev">‹</button>

      <h2>
        Menu settimanale
      </h2>

      <button id="menuNext">›</button>

    </div>

    <div class="menu-grid">
  `;

  DAYS.forEach((dayName, index) => {

    const date = new Date(monday);

    date.setDate(
      monday.getDate() + index
    );

    const dateKey = iso(date);

    const menu =
      state.menus[dateKey] || {};

    html += `
      <div class="menu-day">

        <div class="menu-day-title">
          ${dayName}
          <span>
            ${date.getDate()}/${date.getMonth() + 1}
          </span>
        </div>
    `;

    FMEALS.forEach((meal, mealIndex) => {

      const key = FKEY[mealIndex];

      html += `
        <div class="meal-row">

          <div class="meal-name">
            ${meal}
          </div>

          <input
            class="menu-input"
            data-date="${dateKey}"
            data-meal="${key}"
            value="${escapeHtml(menu[key] || "")}"
            placeholder="Inserisci..."
          >

        </div>
      `;

    });

    html += `
      </div>
    `;

  });

  html += `
    </div>
  `;

  el.innerHTML = html;

  document
    .getElementById("menuPrev")
    ?.addEventListener("click", () => {

      menuOffset--;
      renderMenu();

    });

  document
    .getElementById("menuNext")
    ?.addEventListener("click", () => {

      menuOffset++;
      renderMenu();

    });

  el
    .querySelectorAll(".menu-input")
    .forEach(input => {

      input.addEventListener("change", () => {

        const date = input.dataset.date;
        const meal = input.dataset.meal;

        if (!state.menus[date]) {
          state.menus[date] = {};
        }

        state.menus[date][meal] =
          input.value.trim();

        save();

      });

    });

}


/* =========================================================
   LISTA DELLA SPESA
   ========================================================= */

function renderShopping() {

  const el = document.getElementById("shopping");

  if (!el) return;

  let html = `
    <div class="section-header">

      <button id="shopPrev">‹</button>

      <h2>
        Lista della spesa
      </h2>

      <button id="shopNext">›</button>

    </div>

    <div class="shopping-container">
  `;

  SHOP_CATS.forEach(cat => {

    const items =
      state.shopping[cat] || [];

    html += `
      <section class="shopping-category">

        <h3>
          ${capitalize(cat)}
        </h3>

        <div class="shopping-add">

          <input
            id="shopInput-${cat}"
            placeholder="Aggiungi prodotto..."
          >

          <button
            data-add-shop="${cat}"
          >
            +
          </button>

        </div>

        <div class="shopping-items">
    `;

    if (!items.length) {

      html += `
        <div class="empty-message">
          Nessun prodotto
        </div>
      `;

    }

    items.forEach((item, index) => {

      html += `
        <div class="shopping-item">

          <label>

            <input
              type="checkbox"
              data-shop-check="${cat}"
              data-index="${index}"
              ${item.done ? "checked" : ""}
            >

            <span class="${item.done ? "done" : ""}">
              ${escapeHtml(item.name)}
            </span>

          </label>

          <button
            data-shop-delete="${cat}"
            data-index="${index}"
          >
            ×
          </button>

        </div>
      `;

    });

    html += `
        </div>

      </section>
    `;

  });

  html += `
    </div>
  `;

  el.innerHTML = html;


  /* Aggiunta prodotto */

  el
    .querySelectorAll("[data-add-shop]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const cat =
          button.dataset.addShop;

        const input =
          document.getElementById(
            `shopInput-${cat}`
          );

        if (!input.value.trim()) return;

        if (!state.shopping[cat]) {
          state.shopping[cat] = [];
        }

        state.shopping[cat].push({
          name: input.value.trim(),
          done: false
        });

        input.value = "";

        save();
        renderShopping();

      });

    });


  /* Checkbox */

  el
    .querySelectorAll("[data-shop-check]")
    .forEach(check => {

      check.addEventListener("change", () => {

        const cat =
          check.dataset.shopCheck;

        const index =
          Number(check.dataset.index);

        state.shopping[cat][index].done =
          check.checked;

        save();

        renderShopping();

      });

    });


  /* Eliminazione */

  el
    .querySelectorAll("[data-shop-delete]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const cat =
          button.dataset.shopDelete;

        const index =
          Number(button.dataset.index);

        state.shopping[cat].splice(index, 1);

        save();

        renderShopping();

      });

    });


  document
    .getElementById("shopPrev")
    ?.addEventListener("click", () => {

      shopOffset--;
      renderShopping();

    });

  document
    .getElementById("shopNext")
    ?.addEventListener("click", () => {

      shopOffset++;
      renderShopping();

    });

}


/* =========================================================
   CALENDARIO
   ========================================================= */

function renderCalendar() {

  const el =
    document.getElementById("calendar");

  if (!el) return;

  const year =
    calDate.getFullYear();

  const month =
    calDate.getMonth();

  const first =
    new Date(year, month, 1);

  const last =
    new Date(year, month + 1, 0);

  const monthName =
    first.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );

  let html = `
    <div class="section-header">

      <button id="calPrev">‹</button>

      <h2>
        ${capitalize(monthName)}
      </h2>

      <button id="calNext">›</button>

    </div>

    <div class="calendar-grid">
  `;

  const startDay =
    first.getDay() === 0
      ? 6
      : first.getDay() - 1;

  for (let i = 0; i < startDay; i++) {

    html += `
      <div class="calendar-empty"></div>
    `;

  }

  for (
    let day = 1;
    day <= last.getDate();
    day++
  ) {

    const date =
      new Date(year, month, day);

    const dateKey =
      iso(date);

    const events =
      state.events.filter(
        event => event.date === dateKey
      );

    html += `
      <div class="calendar-day">

        <div class="calendar-day-number">
          ${day}
        </div>

        <div class="calendar-events">
    `;

    events.forEach((event, index) => {

      const person =
        PEOPLE[event.person] ||
        PEOPLE.famiglia;

      html += `
        <div
          class="calendar-event"
          style="border-left:4px solid ${person.color}"
        >

          <strong>
            ${escapeHtml(event.title)}
          </strong>

          ${
            event.time
              ? `<small>${escapeHtml(event.time)}</small>`
              : ""
          }

          <span>
            ${person.name}
          </span>

          <button
            data-delete-event="${event.id}"
          >
            ×
          </button>

        </div>
      `;

    });

    html += `
        </div>

        <button
          class="add-event"
          data-add-event="${dateKey}"
        >
          +
        </button>

      </div>
    `;

  }

  html += `
    </div>

    <div class="calendar-form">

      <h3>
        Aggiungi impegno
      </h3>

      <input
        id="eventTitle"
        placeholder="Titolo"
      >

      <input
        id="eventDate"
        type="date"
      >

      <input
        id="eventTime"
        type="time"
      >

      <select id="eventPerson">

        <option value="famiglia">
          Famiglia
        </option>

        <option value="alessio">
          Alessio
        </option>

        <option value="francesca">
          Francesca
        </option>

        <option value="sara">
          Sara
        </option>

        <option value="vera">
          Vera
        </option>

      </select>

      <button id="addEventButton">
        Aggiungi
      </button>

    </div>
  `;

  el.innerHTML = html;


  /* Navigazione mese */

  document
    .getElementById("calPrev")
    ?.addEventListener("click", () => {

      calDate.setMonth(
        calDate.getMonth() - 1
      );

      renderCalendar();

    });

  document
    .getElementById("calNext")
    ?.addEventListener("click", () => {

      calDate.setMonth(
        calDate.getMonth() + 1
      );

      renderCalendar();

    });


  /* Data predefinita */

  const eventDate =
    document.getElementById("eventDate");

  if (eventDate) {
    eventDate.value =
      iso(new Date());
  }


  /* Aggiungi evento */

  document
    .getElementById("addEventButton")
    ?.addEventListener("click", () => {

      const title =
        document
          .getElementById("eventTitle")
          .value.trim();

      const date =
        document
          .getElementById("eventDate")
          .value;

      const time =
        document
          .getElementById("eventTime")
          .value;

      const person =
        document
          .getElementById("eventPerson")
          .value;

      if (!title || !date) return;

      state.events.push({
        id: Date.now().toString(),
        title,
        date,
        time,
        person
      });

      save();

      renderCalendar();

    });


  /* Aggiunta rapida dal giorno */

  el
    .querySelectorAll("[data-add-event]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const date =
          button.dataset.addEvent;

        document
          .getElementById("eventDate")
          .value = date;

        document
          .getElementById("eventTitle")
          .focus();

      });

    });


  /* Eliminazione evento */

  el
    .querySelectorAll("[data-delete-event]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          button.dataset.deleteEvent;

        state.events =
          state.events.filter(
            event => event.id !== id
          );

        save();

        renderCalendar();

      });

    });

}


/* =========================================================
   NOTE
   ========================================================= */

function renderNotes() {

  const el =
    document.getElementById("notes");

  if (!el) return;

  let html = `
    <div class="section-header">

      <h2>
        Note
      </h2>

    </div>

    <div class="notes-add">

      <textarea
        id="noteText"
        placeholder="Scrivi una nota..."
      ></textarea>

      <button id="addNote">
        Aggiungi nota
      </button>

    </div>

    <div class="notes-list">
  `;

  if (!state.notes.length) {

    html += `
      <div class="empty-message">
        Nessuna nota
      </div>
    `;

  }

  state.notes.forEach((note, index) => {

    html += `
      <div class="note-card">

        <div>
          ${escapeHtml(note.text)}
        </div>

        <button
          data-delete-note="${index}"
        >
          ×
        </button>

      </div>
    `;

  });

  html += `
    </div>
  `;

  el.innerHTML = html;


  document
    .getElementById("addNote")
    ?.addEventListener("click", () => {

      const input =
        document.getElementById("noteText");

      const text =
        input.value.trim();

      if (!text) return;

      state.notes.unshift({
        text,
        createdAt: new Date().toISOString()
      });

      save();

      renderNotes();

    });


  el
    .querySelectorAll("[data-delete-note]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const index =
          Number(button.dataset.deleteNote);

        state.notes.splice(index, 1);

        save();

        renderNotes();

      });

    });

}


/* =========================================================
   RICETTE
   ========================================================= */

function renderRecipes() {

  const el =
    document.getElementById("recipes");

  if (!el) return;

  let html = `
    <div class="section-header">

      <h2>
        Ricette
      </h2>

    </div>

    <div class="recipe-add">

      <input
        id="recipeTitle"
        placeholder="Nome della ricetta"
      >

      <textarea
        id="recipeText"
        placeholder="Ingredienti e preparazione..."
      ></textarea>

      <button id="addRecipe">
        Salva ricetta
      </button>

    </div>

    <div class="recipes-list">
  `;

  if (!state.recipes.length) {

    html += `
      <div class="empty-message">
        Nessuna ricetta
      </div>
    `;

  }

  state.recipes.forEach((recipe, index) => {

    html += `
      <article class="recipe-card">

        <h3>
          ${escapeHtml(recipe.title)}
        </h3>

        <div>
          ${escapeHtml(recipe.text).replace(/\n/g, "<br>")}
        </div>

        <button
          data-delete-recipe="${index}"
        >
          Elimina
        </button>

      </article>
    `;

  });

  html += `
    </div>
  `;

  el.innerHTML = html;


  document
    .getElementById("addRecipe")
    ?.addEventListener("click", () => {

      const title =
        document
          .getElementById("recipeTitle")
          .value.trim();

      const text =
        document
          .getElementById("recipeText")
          .value.trim();

      if (!title) return;

      state.recipes.unshift({
        title,
        text
      });

      save();

      renderRecipes();

    });


  el
    .querySelectorAll("[data-delete-recipe]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const index =
          Number(button.dataset.deleteRecipe);

        state.recipes.splice(index, 1);

        save();

        renderRecipes();

      });

    });

}


/* =========================================================
   FUNZIONI UTILI
   ========================================================= */

function capitalize(text) {

  if (!text) return "";

  return text.charAt(0).toUpperCase()
    + text.slice(1);

}


function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(content) {

  const modal =
    document.getElementById("modal");

  if (!modal) return;

  modal.innerHTML = content;

  modal.classList.add("active");

}


function closeModal() {

  const modal =
    document.getElementById("modal");

  if (!modal) return;

  modal.classList.remove("active");

  modal.innerHTML = "";

}


/* =========================================================
   RENDER COMPLETO
   ========================================================= */

function renderAll() {

  renderHome();
  renderMenu();
  renderShopping();
  renderCalendar();
  renderNotes();
  renderRecipes();

}


/* =========================================================
   AVVIO APP
   ========================================================= */

document.body.style.visibility = "hidden";


initAuth();


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("service-worker.js")
      .catch(error => {
        console.error(
          "Service Worker:",
          error
        );
      });

  });

}

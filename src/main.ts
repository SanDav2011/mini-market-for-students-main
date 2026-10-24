import "./style.css";

type Product = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  image: string;
  description?: string;
};

type CartItem = { productId: number; quantity: number };
type Delivery = "pickup" | "courier";
type Order = {
  name: string;
  email: string;
  delivery: Delivery;
  address: string;
  comment: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryCost: number;
  total: number;
};

const products: Product[] = [
  { id: 1, name: "Тетрадь", price: 500, inStock: true, image: new URL("../pictures/notebook.jpg", import.meta.url).href, description: "Клетка, 48 листов" },
  { id: 2, name: "Ручка", price: 200, inStock: false, image: new URL("../pictures/pen.jpg", import.meta.url).href, description: "Синяя шариковая ручка" },
  { id: 3, name: "Рюкзак", price: 8000, inStock: true, image: new URL("../pictures/bag.jpg", import.meta.url).href, description: "Удобный рюкзак для учебников" },
  { id: 4, name: "Карандаш", price: 100, inStock: true, image: new URL("../pictures/pencil.jpg", import.meta.url).href, description: "Простой карандаш" },
  { id: 5, name: "Пенал", price: 2500, inStock: true, image: new URL("../pictures/suitcase.jpg", import.meta.url).href, description: "Пенал на молнии" },
  { id: 6, name: "Альбом", price: 700, inStock: true, image: new URL("../pictures/albom.jpg", import.meta.url).href, description: "Альбом для рисования, 24 листа" },
];

const cart: CartItem[] = [];

function getElement<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Не найден элемент: ${id}`);
  return element;
}

const productsBox = getElement("products", HTMLDivElement);
const cartTable = getElement("cart-table", HTMLTableElement);
const cartBody = getElement("cart-body", HTMLTableSectionElement);
const emptyCart = getElement("empty-cart-message", HTMLParagraphElement);
const cartCount = getElement("cart-count", HTMLSpanElement);
const sumElement = getElement("summ", HTMLSpanElement);
const searchInput = getElement("search-input", HTMLInputElement);
const maxPriceInput = getElement("max-price-input", HTMLInputElement);
const inStockOnly = getElement("in-stock-only", HTMLInputElement);
const filterError = getElement("filter-error", HTMLParagraphElement);
const deliverySelect = getElement("delivery-type", HTMLSelectElement);
const addressRow = getElement("address-row", HTMLDivElement);
const addressInput = getElement("address", HTMLTextAreaElement);
const orderForm = getElement("order-form", HTMLFormElement);
const orderError = getElement("order-error", HTMLParagraphElement);
const orderResult = getElement("order-result", HTMLDivElement);
const orderSum = getElement("order-summ", HTMLSpanElement);
const deliveryCostElement = getElement("delivery-cost", HTMLSpanElement);
const orderTotal = getElement("order-total", HTMLSpanElement);

function renderProducts(): void {
  productsBox.replaceChildren();
  filterError.textContent = "";

  const priceText = maxPriceInput.value.trim();
  const maxPrice = priceText ? Number(priceText) : Infinity;
  if (maxPriceInput.validity.badInput ||
      (priceText !== "" && !Number.isFinite(maxPrice)) ||
      maxPrice < 0) {
    filterError.textContent = "Введите корректную неотрицательную максимальную цену.";
    return;
  }

  const search = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search) &&
    product.price <= maxPrice &&
    (!inStockOnly.checked || product.inStock)
  );

  if (!filtered.length) {
    productsBox.textContent = "Товары не найдены";
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = product.image;
    image.alt = product.name;
    const name = document.createElement("h3");
    name.textContent = product.name;
    card.append(image, name);

    if (product.description) {
      const description = document.createElement("p");
      description.textContent = product.description;
      card.append(description);
    }

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = `${product.price} ₸`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = product.inStock ? "В корзину" : "Нет в наличии";
    button.disabled = !product.inStock;
    button.addEventListener("click", () => addToCart(product.id));
    card.append(price, button);
    productsBox.append(card);
  });
}

function addToCart(id: number): void {
  const product = products.find((item) => item.id === id);
  if (!product || !product.inStock) return;
  const item = cart.find((cartItem) => cartItem.productId === id);
  if (item) item.quantity++;
  else cart.push({ productId: id, quantity: 1 });
  updateCart();
}

function removeFromCart(id: number): void {
  const index = cart.findIndex((item) => item.productId === id);
  if (index !== -1) cart.splice(index, 1);
  updateCart();
}

function updateCart(): void {
  cartBody.replaceChildren();
  emptyCart.classList.toggle("hidden", cart.length > 0);
  cartTable.classList.toggle("hidden", cart.length === 0);

  let totalItems = 0;
  let subtotal = 0;

  cart.forEach((item) => {
    const product = products.find((current) => current.id === item.productId);
    if (!product) return;

    const itemTotal = product.price * item.quantity;
    totalItems += item.quantity;
    subtotal += itemTotal;
    const row = document.createElement("tr");
    row.innerHTML = "<td>" + product.name + "</td><td>" + product.price + " ₸</td><td>" + item.quantity + "</td><td>" + itemTotal + " ₸</td><td><button type=\"button\">Удалить</button></td>";
    row.querySelector("button")?.addEventListener("click", () => removeFromCart(product.id));
    cartBody.append(row);
  });

  cartCount.textContent = String(totalItems);
  sumElement.textContent = String(subtotal);

  let clearButton = cartTable.parentElement?.querySelector<HTMLButtonElement>(".clear-cart");
  if (cart.length && !clearButton) {
    clearButton = document.createElement("button");
    clearButton.className = "clear-cart";
    clearButton.type = "button";
    clearButton.textContent = "Очистить корзину";
    clearButton.addEventListener("click", () => {
      cart.length = 0;
      updateCart();
    });
    cartTable.after(clearButton);
  } else if (!cart.length) {
    clearButton?.remove();
  }

  updateOrderSummary();
}

function getDelivery(value: string): Delivery | null {
  return value === "pickup" || value === "courier" ? value : null;
}

function updateOrderSummary(): void {
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((current) => current.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const delivery = getDelivery(deliverySelect.value);
  const deliveryCost = delivery === "courier" ? 1000 : 0;
  orderSum.textContent = String(subtotal);
  deliveryCostElement.textContent = String(deliveryCost);
  orderTotal.textContent = String(subtotal + deliveryCost);
}

getElement("apply-filters", HTMLButtonElement).addEventListener("click", renderProducts);
getElement("reset-filters", HTMLButtonElement).addEventListener("click", () => {
  searchInput.value = "";
  maxPriceInput.value = "";
  inStockOnly.checked = false;
  renderProducts();
});

deliverySelect.addEventListener("change", () => {
  const courier = deliverySelect.value === "courier";
  addressRow.classList.toggle("hidden", !courier);
  if (!courier) addressInput.value = "";
  updateOrderSummary();
});

orderForm.addEventListener("submit", (event: SubmitEvent): void => {
  event.preventDefault();
  orderError.textContent = "";
  if (!cart.length) {
    orderError.textContent = "Сначала добавьте товары в корзину.";
    return;
  }

  const name = getElement("customer-name", HTMLInputElement).value.trim();
  const emailInput = getElement("customer-email", HTMLInputElement);
  const email = emailInput.value.trim();
  const comment = getElement("comment", HTMLTextAreaElement).value.trim();
  const confirmed = getElement("order-confirm", HTMLInputElement).checked;
  const delivery = getDelivery(deliverySelect.value);

  if (name.length < 2) orderError.textContent = "Имя должно содержать хотя бы 2 символа.";
  else if (!emailInput.validity.valid) orderError.textContent = "Введите корректный email.";
  else if (!delivery) orderError.textContent = "Выберите способ получения заказа.";
  else if (delivery === "courier" && !addressInput.value.trim()) orderError.textContent = "Укажите адрес доставки.";
  else if (!confirmed) orderError.textContent = "Подтвердите состав заказа.";
  if (orderError.textContent) return;
  if (!delivery) return;

  const items = cart.map((item) => {
    const product = products.find((current) => current.id === item.productId);
    if (!product) throw new Error(`Не найден товар с ID ${item.productId}`);
    return { name: product.name, price: product.price, quantity: item.quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCost = delivery === "courier" ? 1000 : 0;
  const order: Order = {
    name, email, delivery,
    address: delivery === "courier" ? addressInput.value.trim() : "",
    comment, items, subtotal, deliveryCost, total: subtotal + deliveryCost,
  };

  orderResult.replaceChildren();
  const thanks = document.createElement("p");
  thanks.textContent = `Спасибо, ${name}! Заказ на ${order.total} ₸ оформлен.`;
  const list = document.createElement("ul");
  order.items.forEach((item) => {
    const line = document.createElement("li");
    line.textContent = `${item.name} × ${item.quantity} — ${item.price * item.quantity} ₸`;
    list.append(line);
  });
  const json = document.createElement("pre");
  json.textContent = JSON.stringify(order, null, 2);
  orderResult.append(thanks, list, json);

  cart.length = 0;
  orderForm.reset();
  addressRow.classList.add("hidden");
  updateCart();
});

renderProducts();
updateCart();
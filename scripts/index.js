import {
    pageView,
    addBook,
    updateBook,
    sortBooks,
    filterBooks,
    search,
    importBooks
} from "./gtm_events.js";

const LS_KEY = 'bookstore_books_v1';

// utilities
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const $ = id => document.getElementById(id);

// state
let books = []; // {id,title,author,year,isbn,qty,price,added}

// load
function load() {
    try { books = JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch (e) { books = [] }
    renderList();
}

function save() { localStorage.setItem(LS_KEY, JSON.stringify(books)); renderList(); }

function renderList() {
    const tbody = $('booksTbody'); tbody.innerHTML = '';
    const q = $('search').value.trim().toLowerCase();
    const filter = $('filter').value; const sort = $('sort').value;

    let filtered = books.filter(b => {
        if (filter === 'in-stock' && (!b.qty || b.qty <= 0)) return false;
        if (filter === 'out' && b.qty > 0) return false;
        if (!q) return true;
        return (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q);
    });

    // sort
    if (sort === 'titleAsc') filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'titleDesc') filtered.sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === 'priceAsc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'priceDesc') filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => b.added - a.added);

    if (filtered.length === 0) { $('empty').style.display = 'block'; $('booksTable').style.display = 'none'; }
    else { $('empty').style.display = 'none'; $('booksTable').style.display = 'table'; }

    filtered.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${escapeHtml(b.title)}</strong><div class="small">${escapeHtml(b.author || '')}</div></td>
                        <td>${escapeHtml(b.author || '')}</td>
                        <td class="small">${b.year || ''}</td>
                        <td class="small">${escapeHtml(b.isbn || '')}</td>
                        <td>${b.qty}</td>
                        <td>${Number(b.price).toFixed(2)} zł</td>
                        <td class="actions"><button class="ghost" onclick="openEdit('${b.id}')">Edytuj</button><button class="ghost" onclick="removeBook('${b.id}')">Usuń</button></td>`;
        tbody.appendChild(tr);
    });

    $('count').textContent = books.length + (books.length === 1 ? ' książka' : ' książek');
    return filtered.length;
}

// add
$('addForm').addEventListener('submit', e => {
    e.preventDefault();
    const book = {
        id: uid(),
        title: $('title').value.trim(),
        author: $('author').value.trim(),
        year: Number($('year').value) || null,
        isbn: $('isbn').value.trim(),
        qty: Number($('qty').value) || 0,
        price: Number($('price').value) || 0,
        added: Date.now()
    };
    if (!book.title) {
        alert('Podaj tytuł'); return
    }
    books.push(book);
    save();
    addBook(book.id, book.qty, book.price);
    $('addForm').reset();
});

$('btnReset').addEventListener('click', () => $('addForm').reset());

// Wyszukiwanie
let searchTimeout;

$('search').addEventListener('input', e => {
    renderList();

    clearTimeout(searchTimeout);

    const searchTerm = e.target.value.trim();

    if (searchTerm.length < 3) return;

    searchTimeout = setTimeout(() => {
        const resultsQuantity = renderList();

        search(searchTerm, resultsQuantity);
    }, 500);
});

// Filtrowanie
$('filter').addEventListener('change', e => {
    filterBooks("availability", e.target.value);
    renderList();
});

// Sortowanie
$('sort').addEventListener('change', e => {
    const sortOptions = {
        titleAsc: ["title", "asc"],
        titleDesc: ["title", "desc"],
        priceAsc: ["price", "asc"],
        priceDesc: ["price", "desc"],
        newest: ["added", "desc"]
    };

    const [sortField, sortDirection] = sortOptions[e.target.value];

    sortBooks(sortField, sortDirection);
    renderList();
});


// edit
function openEdit(id) {
    const b = books.find(x => x.id === id); if (!b) return;
    $('editId').value = b.id; $('editTitle').value = b.title; $('editAuthor').value = b.author; $('editYear').value = b.year || ''; $('editQty').value = b.qty; $('editIsbn').value = b.isbn; $('editPrice').value = b.price;
    $('modal').style.display = 'flex';
}
window.openEdit = openEdit;

$('modalClose').addEventListener('click', () => $('modal').style.display = 'none');

$('editForm').addEventListener('submit', e => {
    e.preventDefault();

    const id = $('editId').value;
    const b = books.find(x => x.id === id);

    if (!b) return;

    // Zachowanie poprzednich danych
    const previousBook = { ...b };

    // Aktualizacja danych
    b.title = $('editTitle').value.trim();
    b.author = $('editAuthor').value.trim();
    b.year = Number($('editYear').value) || null;
    b.qty = Number($('editQty').value) || 0;
    b.isbn = $('editIsbn').value.trim();
    b.price = Number($('editPrice').value) || 0;

    // Ustalenie zmienionych pól
    const changedFields = Object.keys(b).filter(
        key => previousBook[key] !== b[key]
    );

    save();

    updateBook(b.id, changedFields);

    $('modal').style.display = 'none';
});


// remove
function removeBook(id) { if (!confirm('Usunąć tę książkę?')) return; books = books.filter(b => b.id !== id); save(); }
window.removeBook = removeBook;

// sample, clear, import/export
$('btnSample').addEventListener('click', () => {
    const sample = [
        { id: uid(), title: 'Lalka', author: 'Bolesław Prus', year: 1890, isbn: '978-83-01-001', qty: 5, price: 39.90, added: Date.now() },
        { id: uid(), title: 'Zbrodnia i kara', author: 'Fiodor Dostojewski', year: 1866, isbn: '978-83-02-002', qty: 2, price: 49.00, added: Date.now() - 1000 },
        { id: uid(), title: 'Mały Książę', author: 'Antoine de Saint-Exupéry', year: 1943, isbn: '978-83-03-003', qty: 0, price: 29.50, added: Date.now() - 2000 }
    ];
    books = books.concat(sample); save();
});

$('btnClear').addEventListener('click', () => {
    if (confirm('Usunąć WSZYSTKIE dane?')) { books = []; save(); }
});

$('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bookstore_export.json'; a.click(); URL.revokeObjectURL(url);
});

$('fileImport').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (Array.isArray(data)) {
                const importedBooks = data.map(d => ({
                    ...d,
                    id: d.id || uid()
                }));

                books = books.concat(importedBooks);
                save();

                importBooks(
                    file.name.split('.').pop().toLowerCase(),
                    importedBooks.length
                );

                alert('Import zakończony.');
            } else alert('Plik nie zawiera listy książek');
        }
        catch (err) { alert('Błąd przy odczycie pliku'); }
    };
    reader.readAsText(file);
    e.target.value = '';
});

function escapeHtml(str) { if (!str) return ''; return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[s])); }

// init
load();
pageView();

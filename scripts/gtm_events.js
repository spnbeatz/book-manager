
const sendEvent = (eventName, parameters = {}) => {
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
        event: eventName,
        ...parameters
    });
};

export const pageView = () => {
    sendEvent("page_view");
};

export const addBook = (bookId, quantity, price) => {
    sendEvent("add_book", {
        book_id: bookId,
        quantity,
        price
    });
};

export const updateBook = (bookId, changedFields) => {
    sendEvent("update_book", {
        book_id: bookId,
        changed_fields: changedFields
    });
};

export const importBooks = (fileFormat, booksImported) => {
    sendEvent("import_books", {
        file_format: fileFormat,
        books_imported: booksImported
    });
};

export const search = (searchTerm, resultsQuantity) => {
    sendEvent("search", {
        search_value: searchTerm,
        results_quantity: resultsQuantity
    });
};

export const filterBooks = (filterType, filterValue) => {
    sendEvent("filter_books", {
        filter_type: filterType,
        filter_value: filterValue
    });
};

export const sortBooks = (sortField, sortDirection) => {
    sendEvent("sort_books", {
        sort_field: sortField,
        sort_direction: sortDirection
    });
};

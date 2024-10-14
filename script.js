window.addEventListener("DOMContentLoaded", function () {
  const url = "http://localhost:3000/users";
  const errorMessageElement = document.getElementById("error-message");
  let users = [];

  const tableBody = document.getElementById("users-table-body");

  // Основная форма
  const form = document.getElementById("user-form");

  // Делаем запрос, ожидаем завершения и используем данные:
  fetchUsers().then((dataUser) => {
    if (dataUser.length) {
      users = dataUser.map((user) => {
        return { ...user, showId: crypto.randomUUID() };
      });
    }

    showUsers(users);

    listeners();
  });

  // Функция на подписку событий
  function listeners() {
    // Привязка обработчика для формы
    form.addEventListener("submit", (event) => {
      // Остановка перезагрузки страницы
      event.preventDefault();

      addUser(event.target);
    });

    tableBody.addEventListener("click", (event) => {
      const target = event.target;

      if (target.id === "btn-edit") {
        editUser(target.showId);
      }

      if (target.id === "btn-delete") {
        deleteUser(target.showId);
      }
    });
  }

  function addUser(event) {
    // Получение данных формы
    const formData = new FormData(event);

    // Пример: получение данных по полям
    const name = formData.get("name");
    const email = formData.get("email");

    fetchAddUser({ name, email });
  }

  function editUser(showIdUser) {
    const rows = document.querySelectorAll(".table-row");

    const currentRow = Array.from(rows).find(
      (row) => row.showId === showIdUser
    );

    if (!currentRow) {
      showError(`Беда. Не найден элемент с showId: ${showIdUser}`);

      return;
    }

    const cellName = currentRow.querySelector("[data-name=name]");
    const cellEmail = currentRow.querySelector("[data-name=email]");
    const cellActions = currentRow.querySelector("[data-name=actions]");

    const saveButton = createBtn("btn-save", "Save", showIdUser);
    const cancalButton = createBtn("btn-cancel", "Cancel", showIdUser);

    cellActions.appendChild(saveButton);
    cellActions.appendChild(cancalButton);

    const inputName = document.createElement("input");
    inputName.value = cellName.textContent;

    const inputEmail = document.createElement("input");
    inputEmail.value = cellEmail.textContent;

    cellName.append(inputName);
    cellEmail.append(inputEmail);

    [cancalButton, saveButton].forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();

        if (event.target.id === "btn-save") {
          const user = users.find(({ showId }) => showId === showIdUser);

          fetchEditUser({
            fields: {
              email: inputEmail.value,
              name: inputName.value,
            },
            userId: user.id,
          });
        }

        if (event.target.id === "btn-cancel") {
          inputName.remove();
          inputEmail.remove();
          saveButton.remove();
          cancalButton.remove();
        }
      });
    });
  }

  // Удаляем пользователя
  function deleteUser(showIdUser) {
    const user = users.find(({ showId }) => showId === showIdUser);

    if (!user) {
      showError("Пользователь не найден");

      return;
    }

    fetchDeleteUser(user).then((isDeleted) => {
      if (!isDeleted) {
        return;
      }

      fetchUsers().then(() => {
        if (dataUser.length) {
          users = dataUser.map((user) => {
            return { ...user, showId: crypto.randomUUID() };
          });
        }

        showUsers(users);
      });
    });
  }

  // Функция для получения и отображения пользователей
  async function fetchUsers() {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch users. Status: " + response.status);
      }

      const users = await response.json();

      if (Array.isArray(users)) {
        return users;
      }

      throw new Error(
        `Invalid data format. Expected an array. Current type: ${typeof users}, ${users} `
      );
    } catch (error) {
      showError("Error fetching users: " + error.message);
    }
  }

  // Отправляем запрос на частичное изменений
  async function fetchEditUser({ fields: { email, name }, userId }) {
    try {
      const response = await fetch(`${url}/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit user. Status: " + response.status);
      }

      return true;
    } catch (error) {
      showError("Error editing user: " + error.message);
    }
  }

  // Удаляем пользователя и отправляем изменения на сервер
  async function fetchDeleteUser(user) {
    try {
      const response = await fetch(`${url}/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user. Status: " + response.status);
      }

      return true;
    } catch (error) {
      showError("Error deleting user: " + error.message);
    }
  }

  // Отправляем нового пользователя на сервер
  async function fetchAddUser({ name, email }) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ name, email, id: createUserId() }),
      });

      return true;
    } catch (error) {
      showError("Error adding user: " + error.message);
    }
  }

  // Отображение пользователей
  function showUsers(users) {
    const fragment = document.createDocumentFragment(); // Создаем фрагмент для массовой вставки

    // Отображение пользователей
    users.forEach(({ name, email, showId }) => {
      // Добавляем строку в таблицу
      fragment.appendChild(createRow({ name, email, showId }));
    });

    tableBody.appendChild(fragment);
  }

  function createRow({ name, email, showId }) {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.showId = showId;

    const nameCell = createTd(name, "name");
    const emailCell = createTd(email, "email");
    const actionsCell = createTd();
    actionsCell.dataset.name = "actions";

    const editButton = createBtn("btn-edit", "Edit", showId);
    const deleteButton = createBtn("btn-delete", "Delete", showId);

    // Добавляем кнопки в ячейку действий
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    // Добавляем ячейки в строку
    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(actionsCell);

    return row;
  }

  // Удаляем содиржимое контента
  function clearСontentElement(element) {
    element.innerHTML = "";
  }

  // Функция для отображения ошибок
  function showError(message) {
    errorMessageElement.textContent = message;
  }

  // создает элемент td
  function createTd(textContent, nameCell) {
    const td = document.createElement("td");

    td.classList.add("table-cell");

    if (nameCell) {
      td.dataset.name = nameCell;
    }

    if (textContent) {
      td.textContent = textContent;
    }

    return td;
  }

  // создает элемент button
  function createBtn(id, textContent, showId) {
    const btn = document.createElement("button");

    btn.id = id;
    btn.textContent = textContent;

    // Создаем кастомное(свое) свойство для сохранения showId
    btn.showId = showId;

    return btn;
  }

  // СОздаем id новому пользователю
  function createUserId() {
    return String(users.length + 1);
  }
});

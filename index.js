"use strict";
import {
  getTasks,
  createNewTask,
  patchTask,
  putTask,
  deleteTask
} from "./utils/taskFunctions.js";

import { initialData } from "./initialData.js";


// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
  };
};

// Get frequently used elements from the DOM
const elements = {
  headerBoardName : document.getElementById("header-board-name"),
  columnDivs : document.querySelectorAll(".column-div"),
  editTaskModal : document.getElementById("edit-task-modal-window"),
  editTaskForm : document.getElementById("edit-task-form"),
  filterDiv : document.getElementById("filterDiv"),
  hideSideBarBtn : document.getElementById("hide-side-bar-btn"),
  showSideBarBtn : document.getElementById("show-side-bar-btn"),
  themeSwitch : document.getElementById("switch"),
  createNewTaskBtn : document.getElementById("add-new-task-btn"),
  modalWindow : document.getElementById("new-task-modal-window"),
  sideBar:  document.getElementById("side-bar-div")
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard :  boards[0]; 
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  };
};

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = '';                                         // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    
    boardElement.addEventListener("click", () => { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;                                                //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });

    boardsContainer.appendChild(boardElement);
  });

};

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();                                               // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks
      .filter(task => task.status === status)
      .forEach(task => { 
        const taskElement = document.createElement("div");
        taskElement.classList.add("task-div");
        taskElement.textContent = task.title;
        taskElement.setAttribute('data-task-id', task.id);

        // Listen for a click event on each task and open a modal
        taskElement.addEventListener("click", () => { openEditTaskModal(task); });

        tasksContainer.appendChild(taskElement);
      });
  });
}


function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
};

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { 
    
    if(btn.textContent === boardName) { btn.classList.add('active'); }
    else { btn.classList.remove('active'); };
  });
};


function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener("click", () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    toggleModal(false, elements.editTaskModal);
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
  });

  // Add new task form submission event listener
  elements.modalWindow.addEventListener('submit',  (event) => {
    addTask(event);
  });
};

// Toggles tasks modal
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
  elements.filterDiv.style.display = show ? 'block' : "none"; // DRY baby
};


function addTask(event) {
  event.preventDefault();

  // Get inputs
  const title = event.target.elements["title-input"].value.trim();
  const description = event.target.elements["desc-input"].value.trim();
  const status = event.target.elements["select-status"].value.trim();

  // Check if valid - Title cannot be empty
  if (title === ""){
    alert("Please enter a non-empty Title");  // Warn
    title.value = "";                         // Reset
    return;
  }

  //Assign user input to the task object
    const task = {
      "title": title,
      "description": description,
      "status": status,
      "board": activeBoard
    };

    const newTask = createNewTask(task);          // Save to localstorage
    if (newTask) {
      toggleModal(false);
      event.target.reset();                       // reset form
      refreshTasksUI();
    };
};


function toggleSidebar(show) {
  if (show){
    elements.sideBar.style.display = 'block';
    elements.showSideBarBtn.style.display = "none";
    localStorage.setItem('showSideBar', 'true');
  } else {
    elements.sideBar.style.display = 'none';
    elements.showSideBarBtn.style.display = "block";
    localStorage.setItem('showSideBar', 'false');
  }
};

function toggleTheme() {
  if (elements.themeSwitch.checked){
    document.documentElement.classList.add("light-theme");
    document.getElementById("logo").src = "./assets/logo-light.svg";
    localStorage.setItem('light-theme', 'enabled');
  }
  else {
    document.documentElement.classList.remove("light-theme");
    document.getElementById("logo").src = "./assets/logo-dark.svg";
    localStorage.setItem('light-theme', 'disabled');
  };
};


function openEditTaskModal(task) {
  
  // Set task details in modal inputs
  elements.editTaskForm.elements["edit-task-title-input"].value = task.title;
  elements.editTaskForm.elements["edit-task-desc-input"].value = task.description;
  elements.editTaskForm.elements["edit-select-status"].value = task.status;

  // Get button elements from the task modal
  const saveBtn = document.getElementById("save-task-changes-btn");
  const delBtn = document.getElementById("delete-task-btn");

  // Use onclick to ensure there is only ever one listener loaded
  // on the edit modal buttons
  // Call saveTaskChanges upon click of Save Changes button
  saveBtn.onclick = () => { 
    
    // Validate
    if(!elements.editTaskForm.reportValidity()){ return; }

    const title = elements.editTaskForm.elements["edit-task-title-input"].value.trim();
    const description = elements.editTaskForm.elements["edit-task-desc-input"].value.trim();
    const status = elements.editTaskForm.elements["edit-select-status"].value.trim();
    
    // Check if valid - Title cannot be empty
    if (title === ""){
      alert("Please enter a non-empty Title");  // Warn
      title.value = "";                         // Reset
      return;
    };

    // Save changes
    const saved = putTask(task.id, {
      "id": task.id,          // use existing ID
      "title": title,
      "description": description,
      "status": status,
      "board": activeBoard
    });
    if (!saved){ console.log("Failed to update Task."); };

    // Close the modal and refresh the UI to reflect the changes
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  };
 
  // Delete task using a helper function and close the task modal
  delBtn.onclick = () => { 
    deleteTask(task.id);

    // Close the modal and refresh the UI to reflect the changes
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  };

  // Show the edit task modal
  toggleModal(true, elements.editTaskModal);
};

/***************
 * RUN PROGRAM *
 ***************/

document.addEventListener('DOMContentLoaded', function() {
  initializeData();
  init();
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  elements.themeSwitch.checked = isLightTheme;    // Set switch to same state
  toggleTheme();                                  // Update UI
  fetchAndDisplayBoardsAndTasks();
};
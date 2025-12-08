import { StudentManager } from "./managers/StudentManager.js";
import { showList } from "./utils/showList.js";
const manager = new StudentManager();
manager.loadFromLocalStorage();
function renderTable(elementId = "studentTableBody") {
    const tableBody = document.getElementById(elementId);
    tableBody.innerHTML = "";
    const students = manager.getAllStudents();
    showList(students);
    students.forEach((s) => {
        tableBody.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.title_name}</td>
        <td>${s.first_name}</td>
        <td>${s.last_name}</td>
        <td>${s.email}</td>
        <td>${s.year}</td>
        <td>${s.major}</td>
      </tr>
    `;
    });
}
// ฟังก์ชันแสดงผลการค้นหา
function renderSearchResults(students, elementId = "studentTableBody") {
    const tableBody = document.getElementById(elementId);
    tableBody.innerHTML = "";
    if (students.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">ไม่พบข้อมูลที่ค้นหา</td>
      </tr>
    `;
        return;
    }
    students.forEach((s) => {
        tableBody.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.title_name}</td>
        <td>${s.first_name}</td>
        <td>${s.last_name}</td>
        <td>${s.email}</td>
        <td>${s.year}</td>
        <td>${s.major}</td>
      </tr>
    `;
    });
}
document.getElementById("addBtn").onclick = () => {
    const id = document.getElementById("id").value;
    const title_name = document.getElementById("title_name").value;
    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    const email = document.getElementById("email").value;
    const year = Number(document.getElementById("year").value);
    const major = document.getElementById("major").value;
    const student = {
        id,
        title_name,
        first_name,
        last_name,
        email,
        year,
        major
    };
    manager.addStudent(student);
    renderTable();
    document.getElementById("id").value = "";
    document.getElementById("title_name").value = "";
    document.getElementById("first_name").value = "";
    document.getElementById("last_name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("year").value = "";
    document.getElementById("major").value = "";
};
document.getElementById("searchNameBtn").onclick = () => {
    const keyword = document.getElementById("searchName").value.trim();
    // ตรวจสอบว่า keyword ไม่เป็นค่าว่าง
    if (!keyword) {
        alert("⚠️ กรุณาใส่ชื่อที่ต้องการค้นหา");
        return;
    }
    const results = manager.findStudentsByName(keyword);
    showList(results);
    renderSearchResults(results);
    alert(`ผลการค้นหา: ${results.length} คน`);
};
document.getElementById("searchMajorBtn").onclick = () => {
    const keyword = document.getElementById("searchMajor").value.trim();
    // ตรวจสอบว่า keyword ไม่เป็นค่าว่าง
    if (!keyword) {
        alert("⚠️ กรุณาใส่สาขาที่ต้องการค้นหา");
        return;
    }
    const results = manager.findStudentsByMajor(keyword);
    showList(results);
    renderSearchResults(results);
    alert(`พบในสาขา: ${results.length} คน`);
};
document.getElementById("searchEmailBtn").onclick = () => {
    const keyword = document.getElementById("searchEmail").value.trim();
    // ตรวจสอบว่า keyword ไม่เป็นค่าว่าง
    if (!keyword) {
        alert("⚠️ กรุณาใส่อีเมลที่ต้องการค้นหา");
        return;
    }
    const results = manager.findStudentsByEmail(keyword);
    showList(results);
    renderSearchResults(results);
    alert(`ผลการค้นหา Email: ${results.length} คน`);
};
renderTable("studentTableBody");

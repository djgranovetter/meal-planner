document.body.onload = function() {
	let date = new Date;
	let month = document.getElementById("month");
	let year = document.getElementById("year");
	if (month !== null && year !== null) {
		month.options[date.getMonth()].selected = true;
		year.value = date.getFullYear();
	} else {
		getData("JSON", "/createtable", (mealPlan) => {
			if (typeof mealPlan == "object") createTable(mealPlan);
			else location = "/mealplanner";
		});
	}
}

function saveMeals() {
	let mealList = {};
	let meals = ["breakfasts", "lunches", "dinners", "saturday_breakfasts", "saturday_lunches", "saturday_dinners"];
	let holidayMeals = document.getElementById("holiday_meals");
	if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none") meals.push("holiday_breakfasts", "holiday_lunches", "holiday_dinners");
	meals.forEach((item) => {
		mealList[item] = document.getElementById(item).value.split("\n");
	});
	postData(mealList, "JSON", "/savemeals", (changes) => {
		if (changes == "Saved!") alert("Meals saved!");
	});
}

function loadMeals() {
	getData("JSON", "/loadmeals", (mealList) => {
		if (typeof mealList !== "object") {
			alert("There are no meals to load.");
			return;
		}
		let counter = 0;
		for (let i in mealList) {
			let currentMeal = Object.keys(mealList)[counter];
			let currentMealList = Object.values(mealList)[counter];
			document.getElementById(currentMeal).value = currentMealList.join("\n");
			counter += 1;
		}
	});
}

function saveMealPlan() {
	postData("", "JSON", "/savemealplan", (changes) => {
		if (changes == "Saved!") alert("Meal plan saved!");
	});
}

function loadMealPlan() {
	getData("JSON", "/loadmealplan", (mealPlan) => {
		if (typeof mealPlan !== "object") {
			alert("No meal plan to load!");
		} else {
			let tableExists = document.getElementById("table");
			if (tableExists !== null) tableExists.remove();
			createTable(mealPlan);
			alert("Meal plan loaded!");
		}
	});
}

function doHolidayMeals() {
	let holidayMeals = document.getElementById("holiday_meals");
	holidayMeals.style.display = "block";
}

function doMealPlan() {
	let breakfasts = document.getElementById("breakfasts").value.split("\n");
	let lunches = document.getElementById("lunches").value.split("\n");
	let dinners = document.getElementById("dinners").value.split("\n");
	let saturdayBreakfasts = document.getElementById("saturday_breakfasts").value.split("\n");
	let saturdayLunches = document.getElementById("saturday_lunches").value.split("\n");
	let saturdayDinners = document.getElementById("saturday_dinners").value.split("\n");
	let holidayMeals = document.getElementById("holiday_meals");
	let holidayBreakfasts = document.getElementById("holiday_breakfasts").value.split("\n");
	let holidayLunches = document.getElementById("holiday_lunches").value.split("\n");
	let holidayDinners = document.getElementById("holiday_dinners").value.split("\n");
	let meals = {breakfasts, lunches, dinners, saturdayBreakfasts, saturdayLunches, saturdayDinners, holidayBreakfasts, holidayLunches, holidayDinners};
	let daysOfHoliday = document.getElementById("days_of_holiday").value.replace(/ /g, "").split(",");
	daysOfHoliday = daysOfHoliday.map((item) => {
		if (item !== "") return parseInt(item);
		else return item;
	});
	let inputMonth = document.getElementById("month");
	inputMonth = inputMonth.options[inputMonth.selectedIndex].value;
	let inputYear = document.getElementById("year").value;
	let ourMonth = new Date(inputYear + ", " + inputMonth + ", " + 1);
	let formError = "";
	if (/\d\d\d\d/.test(inputYear) == false) formError = "Please enter a valid date.";
	else if (breakfasts.length * 3 < weekdayMealCount(ourMonth, saturdayMealCount(ourMonth)) / 3) formError = "Please enter more breakfasts.";
	else if (lunches.length * 3 < weekdayMealCount(ourMonth, saturdayMealCount(ourMonth)) / 3) formError = "Please enter more lunches.";
	else if (dinners.length * 3 < weekdayMealCount(ourMonth, saturdayMealCount(ourMonth)) / 3) formError = "Please enter more dinners.";
	else if (saturdayBreakfasts.length * 3 < saturdayMealCount(ourMonth) / 3) formError = "Please enter more Saturday breakfasts.";
	else if (saturdayLunches.length * 3 < saturdayMealCount(ourMonth) / 3) formError = "Please enter more Saturday lunches.";
	else if (saturdayDinners.length * 3 < saturdayMealCount(ourMonth) / 3) formError = "Please enter more Saturday dinners.";
	else if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none" && daysOfHoliday == "") formError = "Please insert the days of the month on which each day of Holiday falls.";
	else if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none" && daysOfHoliday.some((item) => typeof item == "string")) formError = "Please insert the days of the month on which each day of Holiday falls. Please use numbers only.";
	else if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none" && holidayBreakfasts.length < 2) formError = "Please enter more Holiday breakfasts.";
	else if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none" && holidayLunches.length < 2) formError = "Please enter more Holiday lunches.";
	else if (getComputedStyle(holidayMeals).getPropertyValue("display") !== "none" && holidayDinners.length < 2) formError = "Please enter more Holiday dinners.";
	else {
		let counter = 0;
		for (let i in meals) {
			if (Object.values(meals)[counter] == "") {
				if (counter < 6 || getComputedStyle(holidayMeals).getPropertyValue("display") !== "none") {
					formError = "Please be sure there are no empty spaces between meals.";
				}
			}
		}
	}
	if (formError !== "") {
		alert(formError);
		return;
	}
	meals = fixMeals(meals, ourMonth, daysOfHoliday.length);
	meals.date = new Date(ourMonth.valueOf());
	meals.daysOfHoliday = daysOfHoliday;
	postData(meals, "JSON", "/createtable", (response) => {
		if (response == "Table created!") open("/mealplan");
	});
}

function createTable(meals) {
	let ourDate = new Date(meals.date.valueOf());
	let monthAndYear = document.getElementById("month_and_year");
	let mealCounter = {weekdays: 0, saturdayot: 0, holidays: 0};
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	monthAndYear.innerHTML = months[ourDate.getMonth()] + " " + ourDate.getFullYear();
	let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	let table = document.createElement("table");
	let td = document.createElement("tbody");
	for (let i = 0; i < 6; i ++) {
		let row = document.createElement("tr");
		for (let j = 0; j < 7; j ++) {
			if (i == 0) {
				let heading = document.createElement("th");
				heading.innerHTML = weekdays[j];
				row.appendChild(heading);
			} else {
				let cell = document.createElement("td");
				let ourMonth = new Date(meals.date.valueOf());
				if (ourDate.getDay() == j && ourDate.getMonth() == ourMonth.getMonth()) {
					let cellDate = document.createElement("p");
					cellDate.innerHTML = ourDate.getDate();
					cellDate.style.float = "left";
					cellDate.style.marginRight = "8px";
					cellDate.style.marginTop = "0px";
					cellDate.style.fontWeight = "bold";
					let cellDetails = document.createElement("p");
					cellDetails.style.marginTop = "0px";
					cellDetails.style.fontStyle = "italic";
					cell.appendChild(cellDate);
					cell.appendChild(cellDetails);
					let cellBreakfasts = document.createElement("p");
					let cellLunches = document.createElement("p");
					let cellDinners = document.createElement("p");
					cellBreakfasts.setAttribute("onclick", "editCell()");
					cellLunches.setAttribute("onclick", "editCell()");
					cellDinners.setAttribute("onclick", "editCell()");
					cellBreakfasts.style.clear = "both";
					if (meals.daysOfHoliday.includes(ourDate.getDate())) {
						cellBreakfasts.setAttribute("id", "cell_holidayBreakfasts_" + mealCounter.holidays);
						cellLunches.setAttribute("id", "cell_holidayLunches_" + mealCounter.holidays);
						cellDinners.setAttribute("id", "cell_holidayDinners_" + mealCounter.holidays);
						mealCounter.holidays ++;
						cellDetails.innerHTML = "Holiday";
						cellBreakfasts.innerHTML = meals.holidayBreakfasts[0];
						cellLunches.innerHTML = meals.holidayLunches[0];
						meals.holidayBreakfasts.shift();
						meals.holidayLunches.shift();
						if (meals.daysOfHoliday.includes(ourDate.getDate() + 1)) {
							cellDinners.innerHTML = meals.holidayDinners[0];
							meals.holidayDinners.shift();
						} else {
							if (ourDate.getDate() == 5) {
								cellDinners.innerHTML = meals.saturdayDinners[0];
								meals.saturdayDinners.shift();
							} else {
								cellDinners.innerHTML = meals.dinners[0];
								meals.dinners.shift();
							}
						}
					} else if (ourDate.getDay() !== 6) {
						cellBreakfasts.setAttribute("id", "cell_breakfasts_" + mealCounter.weekdays);
						cellLunches.setAttribute("id", "cell_lunches_" + mealCounter.weekdays);
						cellDinners.setAttribute("id", "cell_dinners_" + mealCounter.weekdays);
						mealCounter.weekdays ++;
						cellBreakfasts.innerHTML = meals.breakfasts[0];
						cellLunches.innerHTML = meals.lunches[0];
						meals.breakfasts.shift();
						meals.lunches.shift();
						if (meals.daysOfHoliday.includes(ourDate.getDate() + 1)) {
							cellDetails.innerHTML = "Erev Holiday";
							cellDinners.innerHTML = meals.holidayDinners[0];
							meals.holidayDinners.shift();
						} else if (ourDate.getDate() !== 5) {
							cellDinners.innerHTML = meals.dinners[0];
							meals.dinners.shift();
						} else {
							cellDinners.innerHTML = meals.saturdayDinners[0];
							meals.saturdayDinners.shift();
						}
					} else {
						cellBreakfasts.setAttribute("id", "cell_saturdayBreakfasts_" + mealCounter.saturdayot);
						cellLunches.setAttribute("id", "cell_saturdayLunches_" + mealCounter.saturdayot);
						cellDinners.setAttribute("id", "cell_saturdayDinners_" + mealCounter.saturdayot);
						mealCounter.saturdayot ++;
						cellBreakfasts.innerHTML = meals.saturdayBreakfasts[0];
						cellLunches.innerHTML = meals.saturdayLunches[0];
						meals.saturdayBreakfasts.shift();
						meals.saturdayLunches.shift();
						if (meals.daysOfHoliday.includes(ourDate.getDate() + 1)) {
							cellDinners.innerHTML = meals.holidayDinners[0];
							meals.holidayDinners.shift();
						} else {
							cellDinners.innerHTML = meals.dinners[0];
							meals.dinners.shift();
						}
					}
					cell.style.verticalAlign = "top";
					cell.style.textAlign = "left";
					cell.style.padding = "5px";
					cell.appendChild(cellBreakfasts);
					cell.appendChild(cellLunches);
					cell.appendChild(cellDinners);
					ourDate.setDate(ourDate.getDate() + 1);
				}
				row.appendChild(cell);
			}
		}
		td.appendChild(row);
	}
	table.appendChild(td);
	document.getElementById("meal_plan").appendChild(table);
	table.setAttribute("border", 1);
	table.setAttribute("id", "table");
	table.style.borderCollapse = "collapse";
	table.style.margin = "48px 30px";
}

function reshuffle() {
	let tableExists = document.getElementById("table");
	if (tableExists !== null) tableExists.remove();
	getData("JSON", "/createtable", (mealPlan) => {
		let counter = 0;
		let currentMeal = null;
		let currentMealList = null;
		console.log(mealPlan);
		for (var item in mealPlan) {
			currentMeal = Object.keys(mealPlan)[counter];
			currentMealList = Object.values(mealPlan)[counter];
			if (Array.isArray(mealPlan[currentMeal]) && typeof mealPlan[currentMeal][0] !== "number") {
				mealPlan[currentMeal] = randomize(currentMealList, Math.floor(currentMealList.length / 15));
			}
			counter ++;
		}
		postData(mealPlan, "JSON", "/createtable", (response) => {
			if (response == "Table created!") createTable(mealPlan);
		});
	});
}

function editCell() {
	let meal = event.target;
	let whichMeal = meal.innerHTML;
	if (whichMeal.includes("&amp;")) whichMeal = whichMeal.replace("&amp;", "&");
	let cell = meal.parentNode;
	let input = document.createElement("input");
	input.setAttribute("type", "text");
	input.style.border = "none";
	input.style.background = "transparent";
	input.style.fontFamily = "times new roman";
	input.style.fontSize = "16px";
	cell.replaceChild(input, meal);
	input.value = whichMeal;
	input.focus();
	input.addEventListener("blur", () => {
		let newMeal = input.value;
		cell.replaceChild(meal, input);
		if (newMeal !== "" && newMeal !== whichMeal) {
			meal.innerHTML = newMeal;
			getData("JSON", "/createtable", (meals) => {
				let currentMeal = meal.id.split("_");
				meals[currentMeal[1]][currentMeal[2]] = newMeal;
				postData(meals, "JSON", "/createtable");
			});
		}
	});
}

function doDownload() {
	domtoimage.toPng(document.getElementById("meal_plan")).then((dataUrl) => {
		var link = document.createElement("a");
		link.download = "meal-plan.png";
		link.href = dataUrl;
		link.click();
	});
}

function saturdayMealCount(month) {
	let ourMonth = new Date(month.valueOf());
	ourMonth.setDate(1);
	let days = new Date(ourMonth.valueOf());
	days.setMonth(days.getMonth() + 1);
	days.setDate(days.getDate() - 1);
	let daysOfMonth = days.getDate();
	let erevSaturdayot = 0;
	let saturdayot = 0;
	for (let i = 0; i < daysOfMonth; i ++) {
		if (ourMonth.getDay() == 5) erevSaturdayot += 1;
		if (ourMonth.getDay() == 6) saturdayot += 1;
		ourMonth.setDate(ourMonth.getDate() + 1);
	}
	return saturdayot * 2 + erevSaturdayot;
}

function weekdayMealCount(days, saturdayMeals) {
	let ourDays = new Date(days.valueOf());
	ourDays.setMonth(ourDays.getMonth() + 1);
	ourDays.setDate(1 - 1);
	return ourDays.getDate() * 3 - saturdayMeals;
}

function fixMeals(obj, month, holidays) {
	let saturdayMeals = saturdayMealCount(month);
	let weekdayMeals = weekdayMealCount(month, saturdayMeals);
	let holidayMeals = holidays * 3;
	for (let i = 0; i < Object.keys(obj).length; i ++) {
		if (i < 3) {
			for (let j = 0; j < weekdayMeals; j ++) {
				if (Object.keys(obj)[i].length < weekdayMeals) obj[Object.keys(obj)[i]].push(Object.values(obj)[i][j]);
			}
		} else if (i < 6) {
			for (let j = 0; j < saturdayMeals; j ++) {
				if (Object.values(obj)[i].length < saturdayMeals) obj[Object.keys(obj)[i]].push(Object.values(obj)[i][j]);
			}
		} else {
			for (let j = 0; j < holidayMeals; j ++) {
				if (Object.values(obj)[i].length < holidayMeals) obj[Object.keys(obj)[i]].push(Object.values(obj)[i][j]);
			}
		}
	}
	let counter = 0;
	for (let i in obj) {
		obj[Object.keys(obj)[counter]] = randomize(Object.values(obj)[counter], Math.floor(Object.values(obj)[counter].length / 15));
	}
	return obj;
}

function randomize(arr, spacer) {
	if (Array.isArray(arr) == false) return;
	let randomArr = [];
	let items = arr.reduce((total, item) => {
		if (total[item] == undefined) total[item] = 1;
		else total[item] ++;
		return total;
	}, {});
	let itemValues = new Set(Object.values(items).sort());
	let repeats = Array.from(itemValues);
	let itemRepeats = {};
	let counter = 0;
	let currentKey = null;
	let currentValue = null;
	for (let item in items) {
		currentKey = Object.keys(items)[counter];
		currentValue = Object.values(items)[counter];
		if (itemRepeats[currentValue] == undefined) itemRepeats[currentValue] = [];
		itemRepeats[currentValue].push(currentKey);
		counter ++;
	}
	let maxRepeats = repeats[repeats.length - 1];
	let holder1 = [], holder2 = [], holder3 = [];
	let randomArrLast = null;
	let itemsToAdd = null;
	let whichItem = null;
	for (let i = 0; i < maxRepeats; i ++) {
		counter = Object.keys(itemRepeats).length - 1;
		for (let item in itemRepeats) {
			whichItem = Object.keys(itemRepeats)[counter];
			if (items[itemRepeats[whichItem][0]] !== 0) {
				holder1 = itemRepeats[whichItem];
				holder1.sort((a, b) => 0.5 - Math.random());
				holder2 = holder2.concat(holder1);
				counter --;
			}
		}
		itemsToAdd = holder2.length;
		for (let j = 0; j < itemsToAdd; j ++) {
			if (j < spacer && randomArr.length > spacer) {
				for (let k = 0; k < spacer; k ++) {
					if (holder2[0] == randomArr[randomArr.length - (k + 1)]) {
						holder3.push(holder2[0]);
						holder2.shift();
					}
				}
			} else {
				if (holder3.length > 0) {
					holder3.forEach((item) => holder2.unshift(item));
					holder3 = [];
				}
			}
			randomArr.push(holder2[0]);
			holder2.shift();
		}
		counter = 0;
		for (let item in items) {
			currentKey = Object.keys(items)[counter];
			if (items[currentKey] > 0) items[currentKey] --;
			counter ++;
		}
	}
	return randomArr;
}

function getData(type, url, callback) {
	let xhr = new XMLHttpRequest();
	let data = null;
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4 && xhr.status == 200) {
			if (type == "JSON" && xhr.responseText !== "") data = JSON.parse(xhr.responseText);
			else if (type == "text") data = xhr.responseText;
			callback(data);
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

function postData(data, type, url, callback) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4 && xhr.status == 200) {
			if (callback !== undefined) callback(xhr.responseText);
		}
	}
	xhr.open("POST", url, true);
	if (type == "JSON") {
		xhr.setRequestHeader("Content-Type", "Application/JSON");
		xhr.send(JSON.stringify(data));
	} else if (type == "text") xhr.send(data);
}
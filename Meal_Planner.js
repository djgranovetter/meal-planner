var http = require("http");
var fs = require("fs");

var mealPlan = null;

function serveFile(response, file, type) {
	if (type == undefined) fs.readFile(file, (error, data) => response.end(data));
	else {
		fs.readFile(file, (error, data) => {
			response.writeHead(200, {"Content-Type": type});
			response.end(data);
		});
	}
}

function redirectPage(response, page) {
	response.writeHead(302, {Location: "http://localhost:3000" + page});
	response.end();
}

function editFile(request, response, file, message, task, subject) {
	var body = "";
	return new Promise((resolve) => {
		request.on("data", (chunk) => {
			body += chunk.toString();
		}).on("end", () => {
			if (file == undefined) resolve(body);
			else {
				if (task == "write_var") body = subject;
				fs.writeFile(file, body, (error) => {
					if (error) throw error;
					else response.end(message);
				});
			}
		});
	});
}

function notFound(response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	response.end("<h2 style='color: red;'>404 error - Page not found!</h2>");
}

http.createServer((request, response) => {
	if (request.method == "GET") {
		if (request.url == "/") redirectPage(response, "/mealplanner");
		else if (request.url == "/loadmeals") serveFile(response, "files/meals.json");
		else if (request.url == "/loadmealplan") serveFile(response, "files/meal_plan.json");
		else if (request.url == "/mealplanner") serveFile(response, "files/meal_planner.html", "text/html");		
		else if (request.url == "/mealplan") serveFile(response, "files/meal_plan.html", "text/html");
		else if (request.url == "/files/meal_planner") serveFile(response, "files/meal_planner.css", "text/css");
		else if (request.url == "/files/meal_planner_functions") serveFile(response, "files/meal_planner_functions.js", "text/javascript");
		else if (request.url == "/files/dom_to_image") serveFile(response, "node_modules/dom-to-image/src/dom-to-image.js", "text/javascript");
		else if (request.url == "/images/notepad") serveFile(response, "files/notepad.jpeg", "image/jpeg");
		else if (request.url == "/createtable") {
			if (mealPlan !== null) response.end(mealPlan);
			else serveFile(response, "files/meal_plan.json");
		} else notFound(response);
	} else if (request.method == "POST") {
		if (request.url == "/savemealplan") editFile(request, response, "files/Meal_plan.json", "Saved!", "write_var", mealPlan);
		else if (request.url == "/savemeals") editFile(request, response, "files/Meals.json", "Saved!");
		else if (request.url == "/createtable") {
			editFile(request, response).then((result) => {
				mealPlan = result;
				response.end("Table created!");
			});
		} else notFound(response);
	}
}).listen(3000);

console.log("Meal Planner server running on port 3000.");

// ============================================================
// ADMIN LOGIN
// admin-login.js
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("adminLoginForm");

    const usernameInput =
        document.getElementById("adminUsername");

    const passwordInput =
        document.getElementById("adminPassword");

    const showPassword =
        document.getElementById("showPassword");

    const loginButton =
        document.getElementById("adminLoginButton");

    const message =
        document.getElementById("adminLoginMessage");


    // ========================================================
    // SHOW / HIDE PASSWORD
    // ========================================================

    if (showPassword) {

        showPassword.addEventListener(
            "change",
            () => {

                if (
                    showPassword.checked
                ) {

                    passwordInput.type =
                        "text";

                } else {

                    passwordInput.type =
                        "password";

                }

            }
        );

    }


    // ========================================================
    // ADMIN LOGIN
    // ========================================================

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const username =
                    usernameInput.value.trim();

                const password =
                    passwordInput.value;


                // --------------------------------------------
                // VALIDATION
                // --------------------------------------------

                if (!username) {

                    showMessage(
                        "Please enter admin username.",
                        "error"
                    );

                    usernameInput.focus();

                    return;

                }


                if (!password) {

                    showMessage(
                        "Please enter admin password.",
                        "error"
                    );

                    passwordInput.focus();

                    return;

                }


                // --------------------------------------------
                // DISABLE BUTTON
                // --------------------------------------------

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Logging in...";


                showMessage(
                    "Checking login...",
                    "info"
                );


                try {

                    // ----------------------------------------
                    // SEND LOGIN REQUEST
                    // ----------------------------------------

                    const response =
                        await fetch(
                            "/api/admin/login",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                credentials:
                                    "same-origin",

                                body: JSON.stringify({

                                    username:
                                        username,

                                    password:
                                        password

                                })

                            }
                        );


                    // ----------------------------------------
                    // READ RESPONSE
                    // ----------------------------------------

                    let data;

                    try {

                        data =
                            await response.json();

                    } catch (jsonError) {

                        data = {

                            success: false,

                            message:
                                "Invalid server response."

                        };

                    }


                    // ----------------------------------------
                    // LOGIN FAILED
                    // ----------------------------------------

                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        showMessage(

                            data.message ||
                            "Invalid username or password.",

                            "error"

                        );

                        passwordInput.value =
                            "";

                        passwordInput.focus();

                        return;

                    }


                    // ----------------------------------------
                    // LOGIN SUCCESS
                    // ----------------------------------------

                    showMessage(

                        "Login successful! Opening dashboard...",

                        "success"

                    );


                    // Store only display information.
                    // The actual authentication is handled
                    // by the HttpOnly cookie from app.js.

                    if (data.admin) {

                        sessionStorage.setItem(

                            "admin",

                            JSON.stringify(
                                data.admin
                            )

                        );

                    }


                    // ----------------------------------------
                    // REDIRECT
                    // ----------------------------------------

                    setTimeout(() => {

                        window.location.href =
                            "/admin-dashboard.html";

                    }, 700);

                }


                catch (error) {

                    console.error(
                        "Admin login error:",
                        error
                    );


                    showMessage(

                        "Unable to connect to server. Please start Node.js server.",

                        "error"

                    );

                }


                finally {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Admin Login";

                }

            }
        );

    }


    // ========================================================
    // MESSAGE FUNCTION
    // ========================================================

    function showMessage(
        text,
        type
    ) {

        if (!message) {
            return;
        }


        message.textContent =
            text;


        message.className =
            "admin-login-message";


        if (type === "success") {

            message.classList.add(
                "success"
            );

        }

        else if (type === "error") {

            message.classList.add(
                "error"
            );

        }

        else {

            message.classList.add(
                "info"
            );

        }

    }

});
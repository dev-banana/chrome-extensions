// DEFINE THE LINK LIST HERE :

const links = [
    {title: "OnlinePHP", url: "https://onlinephp.io/", img: "images/logo-php.png"},
    {title: "Laravel Playground", url: "https://laravelplayground.com/", img: "images/logo-laravel.png"},
    {title: "CodeSandbox", url: "https://codesandbox.io/dashboard/templates", img: "images/logo-react.png"},
];



const container = document.getElementById("list-links");

// Iterate through the links and create elements for each link
links.forEach(link => {

    const linkEl = `
        <a class="link-button" href="${link.url}" target="_blank">
            <img src="${link.img}" alt="${link.img ?? "empty-logo"}"/>
            <div>
                <div class="title">${link.title}</div>
                <div class="subtitle">${link.subtitle ?? link.url}</div>
            </div>
        </a>
    `;

    container.insertAdjacentHTML('beforeend', linkEl);
});

// listen the onClick element
document.querySelectorAll(".link-button").forEach( button => {
    button.onclick = function (e) {
        const url = e.target.getAttribute("data-url");
        if( !!url ) {
            chrome.tabs.create({url: url});
        }
    }
});
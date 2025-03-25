const diseaseList = [
    "Diabetes",
    "Hypertension",
    "Asthma",
    "COVID-19",
    "Flu",
    "Tuberculosis",
    "Depression",
    "Anxiety",
    "Heart Disease",
    "Stroke",
    "Cancer",
    "Malaria"
];

function searchFunction() {
    let input = document.getElementById("searchBox").value.toLowerCase();
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    if (input === "") {
        resultsDiv.style.display = "none";
        return;
    }

    let filteredResults = diseaseList.filter(disease => disease.toLowerCase().includes(input));

    if (filteredResults.length > 0) {
        resultsDiv.style.display = "block";
        filteredResults.forEach(disease => {
            let div = document.createElement("div");
            div.classList.add("result-item");
            div.innerText = disease;
            div.onclick = () => {
                document.getElementById("searchBox").value = disease;
                resultsDiv.style.display = "none";
                scrollToDisease(disease);
            };
            resultsDiv.appendChild(div);
        });
    } else {
        resultsDiv.style.display = "none";
    }
}

function scrollToDisease(disease) {
    const normalizedDisease = disease.toLowerCase();
    const blogGrid = document.getElementById("blog-grid");
    const blogCards = document.getElementsByClassName("blog__card");

    blogGrid.scrollIntoView({ behavior: "smooth" });

    let found = false;
    for (let card of blogCards) {
        const title = card.querySelector("h4").innerText.toLowerCase();
        if (title.includes(normalizedDisease)) {
            found = true;
            Array.from(blogCards).forEach(c => c.classList.remove("highlighted"));
            card.classList.add("highlighted");
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
        }
    }

    if (!found) {
        console.log(`No blog post found for ${disease}`);
    }
}

function showBlogModal(postId) {
    const modal = document.getElementById("blog-modal");
    const modalBody = document.getElementById("modal-body");
    const blogPost = blogContent[postId]; // blogContent is now global from blog.html

    if (blogPost) {
        modalBody.innerHTML = `
            <img src="${blogPost.image}" alt="${blogPost.title}">
            ${blogPost.content}
        `;
        modal.style.display = "block";
    }
}

// Event listeners for "Read More" links
document.addEventListener("DOMContentLoaded", () => {
    const readMoreLinks = document.querySelectorAll(".read-more");
    readMoreLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const postId = link.getAttribute("data-post");
            showBlogModal(postId);
        });
    });

    // Close modal
    const closeBtn = document.querySelector(".modal__close");
    closeBtn.addEventListener("click", () => {
        document.getElementById("blog-modal").style.display = "none";
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("blog-modal");
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});
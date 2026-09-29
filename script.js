import data from './data/proposal.json' with { type: 'json' };

const openButton = document.getElementById('open-button');
const introScreen = document.getElementById('intro-screen');
const storyScreen = document.getElementById('story-screen');

openButton.addEventListener('click', () => {
    introScreen.hidden = true;
    storyScreen.hidden = false;

    renderScreen();
});

const sceneTitle = document.getElementById('scene-title');
const sceneImage = document.getElementById('scene-image');
const sceneText = document.getElementById('scene-text');
const sceneNumber = document.getElementById('scene-number');

let currentScene = 0;

const proposal = JSON.parse(JSON.stringify(data));

function renderScreen(){
    const scene = proposal[currentScene];

    sceneTitle.textContent = scene.name;
    sceneImage.src = scene.gif;
    sceneText.textContent = scene.text;
    sceneNumber.textContent = currentScene + 1;
}

const proposalScreen = document.getElementById('proposal-screen');

const nextButton = document.getElementById('next-button');
nextButton.addEventListener('click', () => {
    if(currentScene >= proposal.length - 1){
        proposalScreen.hidden = false;
        storyScreen.hidden = true;
    }
    currentScene++; 
    renderScreen();
})
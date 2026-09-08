class Video {
	constructor(title, uploader, time) {
		this.title = title;
		this.uploader = uploader;
		this.time = time;
	}

	watch() {
		return `${this.uploader} watched all ${this.time} of ${this.title}!`;
	}
}

// Two individual Video instances
const firstVideo = new Video('JavaScript Basics', 'Erick', 420);
const secondVideo = new Video('Building a Portfolio', 'Alex', 600);

console.log(firstVideo.watch());
console.log(secondVideo.watch());

// Five videos stored as objects, then converted into Video instances.
const videoData = [
	{ title: 'HTML Fundamentals', uploader: 'Maya', time: 300 },
	{ title: 'CSS Layouts', uploader: 'Noah', time: 480 },
	{ title: 'JavaScript Arrays', uploader: 'Lina', time: 360 },
	{ title: 'DOM Events', uploader: 'Sam', time: 525 },
	{ title: 'Object Oriented Programming', uploader: 'Jordan', time: 720 }
];

const videos = videoData.map(({ title, uploader, time }) => {
	return new Video(title, uploader, time);
});

videos.forEach((video) => console.log(video.watch()));

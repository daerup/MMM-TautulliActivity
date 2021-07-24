/**
 * MMM-TautulliActivity
 * Tautulli watch activity module for MagicMirror2.
 *
 * @author Derek Nicol <1420397+derekn@users.noreply.github.com>
 * @license https://opensource.org/licenses/MIT
 */
Module.register('MMM-TautulliActivity', {
	defaults: {
		host: '',
		apiKey: '',
		updateFrequency: 2  * 60 * 1000,
		hideOnNoActivity: false,
		animationSpeed: 500,
		stateIcons: {
			'playing': 'far fa-play-circle',
			'paused': 'far fa-pause-circle',
			'buffering': 'fas fa-sync-alt',
		},
	},
	activityData: null,
	interval: null,
	getStyles: function() {
		return [
			'MMM-TautulliActivity.css',
		]
	},
	countProgress: function(){
		var offset = document.getElementsByClassName('offset');
		for (var i = 0; i < offset.length; i++) {
			var activity = offset[i].closest('.activity-row');
			var duration = this.convertToMS(activity.querySelector('.details > .wholeDuration').innerHTML);
			var newOffset = this.convertToMS(offset[i].innerHTML)

			var shouldCount = duration - newOffset > 1500;

			if(activity.classList.contains("playing")){
				var newOffset = this.convertToMS(offset[i].innerHTML);
				offset[i].innerHTML =  shouldCount ? `${this.convertFromMS(+newOffset + 1000)}` : `-`;
			}

		}

	},

	start: function() {
		Log.info(`Starting module: ${this.name}`);

		this.config.host = this.config.host.trim().replace(/\/$/, '')
		this.config.updateFrequency = this.config.updateFrequency;

		this.sendSocketNotification('INIT', this.config);


	},

	getDom: function() {
		var wrapper = document.createElement('div');
		wrapper.className = 'small';

		if (! this.activityData) {
			wrapper.innerHTML = '<span class="loading dimmed">loading&hellip;</span>';
			// clearInterval(this.interval);
		} else if (typeof this.activityData === 'string') {
			wrapper.innerHTML = `<span class="error">${this.activityData}</span>`;
			// clearInterval(this.interval);
		} else if (! this.activityData.sessions.length) {
			if (this.config.hideOnNoActivity && ! this.hidden) {
				this.hide();
			}
			wrapper.innerHTML = '<span class="no-activity dimmed">nothing is currently playing</span>';
		} else {
			for (const row of this.activityData.sessions) {
				if(row.media_type == "movie"){
					var additionalInfo = `${row.year}`;
				}else{
					var season = (row.parent_media_index);
					var episode = (row.media_index);

					var additionalInfo = `S${season.padStart(2,"0")}E${episode.padStart(2,"0")}`;
				}

				wrapper.innerHTML += `
					<div class="activity-row ${row.state}" data-user-id="${row.user_id}">
						<div class="activity">
							<i class="state-icon bright ${this.config.stateIcons[row.state || 'far circle']}"></i> <span class="user-name bright">${row.friendly_name}</span>
							<span class="title no-wrap">${row.full_title}</span>
							<span class="title-year dimmed">
								(${additionalInfo})</span>
						</div>
						<div class="details xsmall">
							<span class="offset duration">${this.convertFromMS(row.view_offset)}</span><span class="seperator duration"> / </span><span class="duration wholeDuration">${this.convertFromMS(row.duration)}</span> <span class="quality">${row.quality_profile}</span> <span class="transcode">${row.transcode_decision}</span>
						</div>
					</div>`;
			}

			if (this.hidden) {
				this.show()
			}
		}

		return wrapper;
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification == 'SET_DATA') 
		{
			this.activityData = payload;
			this.updateDom(this.config.animationSpeed);
			clearInterval(this.interval);
			this.interval = setInterval(()=> { this.countProgress() }, 1000);
		}
	},

	convertFromMS: function(milliseconds) {
		var seconds = Math.floor((milliseconds / 1000) % 60);
		var minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
		var hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 60);

		if (hours) {
			return `${String(hours).padStart(2, 0)}:${String(minutes).padStart(2, 0)}:${String(seconds).padStart(2, 0)}`;
		} else {
			return `${String(minutes).padStart(2, 0)}:${String(seconds).padStart(2, 0)}`;
		}
	},

	convertToMS: function(formattedTime) {
		var splitTime = formattedTime.split(":");
		splitTime = splitTime.map(x => x * 1000);
		var milliseconds = splitTime.pop();
	
		splitTime.forEach(() => { 
			splitTime = splitTime.map(x => x * 60);
			milliseconds += splitTime.pop();
		})
	   
		return milliseconds;
	}
});
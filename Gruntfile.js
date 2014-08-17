module.exports = function(grunt) {
	grunt.initConfig({
		compress: {
			main: {
				options: {
				  archive: 'dist/dist.zip'
				},
				files: [
					{expand: true, cwd: 'src/', src: ['**/*']}
				]
		    }
		},
		jshint: {
			all: ['Gruntfile.js', 'src/js/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default',[
		'jshint',
		'compress'
	]);
};
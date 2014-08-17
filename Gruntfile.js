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
		},
		jsbeautifier: {
			files: ['src/js/*.js'],
			options: {}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsbeautifier');

	grunt.registerTask('default',[
		'jshint',
		'jsbeautifier',
		'compress'
	]);
	
};
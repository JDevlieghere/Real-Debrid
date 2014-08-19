module.exports = function(grunt) {

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: 'dist/dist.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*']
                }]
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'src/js/*.js']
        },
        jsbeautifier: {
            files: ['Gruntfile.js', 'src/js/*.js', 'src/html/*.html'],
            options: {}
        },
        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/scss',
                    src: ['*.scss'],
                    dest: 'src/css',
                    ext: '.css'
                }]
            }
        },
        watch: {
            sass: {
                files: 'src/scss/*.scss',
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'sass',
        'jshint',
        'jsbeautifier',
        'compress'
    ]);

    grunt.registerTask('develop', [
        'sass',
        'watch'
    ]);

};

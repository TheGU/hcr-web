module.exports = function (grunt) {

    grunt.initConfig({
        bowercopy: {
            options: {
                srcPrefix: 'bower_components'
            },
            scripts: {
                options: {
                    clean: false,
                    destPrefix: 'public'
                },
                files: {
                    'js/vendor/angular.min.js': 'angular/angular.min.js',
                    'js/vendor/angular.min.js.map': 'angular/angular.min.js.map',               
                    
                    'js/vendor/angular-route.min.js': 'angular-route/angular-route.min.js',
                    'js/vendor/angular-route.min.js.map': 'angular-route/angular-route.min.js.map',     
                    
                    'js/vendor/angular-sanitize.min.js': 'angular-sanitize/angular-sanitize.min.js',
                    'js/vendor/angular-sanitize.min.js.map': 'angular-sanitize/angular-sanitize.min.js.map',                       
                    
                    'js/vendor/bootstrap-colorpicker-module.min.js': 'angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js',
                    'css/colorpicker.min.css': 'angular-bootstrap-colorpicker/css/colorpicker.min.css',
                    
                    'js/vendor/bootstrap.min.js': 'bootstrap/dist/js/bootstrap.min.js',
                    'css/bootstrap.min.css': 'bootstrap/dist/css/bootstrap.min.css',
                    'fonts/glyphicons-halflings-regular.eot': "bootstrap/dist/fonts/glyphicons-halflings-regular.eot",
                    'fonts/glyphicons-halflings-regular.svg': "bootstrap/dist/fonts/glyphicons-halflings-regular.svg",
                    'fonts/glyphicons-halflings-regular.ttf': "bootstrap/dist/fonts/glyphicons-halflings-regular.ttf",
                    'fonts/glyphicons-halflings-regular.woff': "bootstrap/dist/fonts/glyphicons-halflings-regular.woff",               
                    
                    'js/vendor/angular-leaflet-directive.min.js': 'angular-leaflet-directive/dist/angular-leaflet-directive.min.js',
                    
                    'js/vendor/angular-local-storage.min.js': 'angular-local-storage/dist/angular-local-storage.min.js',
                    
                    'js/vendor/bootstrap-without-jquery.min.js': 'bootstrap-without-jquery/bootstrap3/bootstrap-without-jquery.min.js',
                    
                    'css/font-awesome.min.css': 'font-awesome/css/font-awesome.min.css',
                    'fonts/': 'font-awesome/fonts/*',
                    
                    'js/vendor/leaflet.js': 'leaflet/dist/leaflet.js',
                    'css/leaflet.css': 'leaflet/dist/leaflet.css',                    
                    'css/images/layers-2x.png': 'leaflet/dist/images/layers-2x.png',
                    'css/images/layers.png': 'leaflet/dist/images/layers.png',
                    'css/images/marker-icon-2x.png': 'leaflet/dist/images/marker-icon-2x.png',
                    'css/images/marker-icon.png': 'leaflet/dist/images/marker-icon.png',
                    'css/images/marker-shadow.png': 'leaflet/dist/images/marker-shadow.png',
                    
                    'js/vendor/leaflet.draw.js': 'leaflet-draw/dist/leaflet.draw.js',
                    'css/leaflet.draw.css': 'leaflet-draw/dist/leaflet.draw.css',
                    'css/images/': 'leaflet-draw/dist/images/*',
                    
                    'js/vendor/leaflet-plugins.Google.js': 'leaflet-plugins/layer/tile/Google.js',
                    
                    'js/vendor/pace.min.js': 'pace/pace.min.js',
                    
                    'js/vendor/leaflet.label.js': 'Leaflet.label/dist/leaflet.label.js',
                    'css/leaflet.label.css': 'Leaflet.label/dist/leaflet.label.css',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bowercopy');
    
    grunt.registerTask('default', ['bowercopy']);
};
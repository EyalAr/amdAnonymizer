(function(){
    module.exports = anonymize;

    var tosource = require('tosource'),
        beautify = require('js-beautify').js_beautify,
        bundleParser = require('./parser');

    function anonymize(bundleSource, mainModule, synonyms){
        synonyms = synonyms || {};

        var modules = bundleParser(bundleSource);

        var modulesMap = modules.reduce(function(p, e, i, o){
            p[e.name] = e;
            return p;
        }, {});

        var factories = modules.reduce(function(p, e, i, o){
            p[e.name] = e.factory;
            return p;
        }, {});

        var externalDeps = modules.reduce(function(p, e, i, o){
            e.deps.forEach(function(dep){
                dep = normalizeDep(e.name, dep, synonyms);
                if (!modulesMap[dep] && p.indexOf(dep) === -1) p.push(dep);
            });
            return p;
        }, []);

        var out = "define(" + tosource(externalDeps) + ", " +
            "function(" +
                externalDeps.map(function(e, i){
                    return "d" + i;
                }).join(",") +
            "){" +
                "var factories = " + tosource(factories) + ";" +
                "return factories['" + mainModule + "'](" +
                    makeDepsInjectionString(mainModule, modulesMap[mainModule].deps) +
                ");" +
            "});";

        return beautify(out, { indent_size: 4 });

        function makeDepsInjectionString(rel, deps){
            var res = deps.map(function(dep){
                console.error(dep);
                dep = normalizeDep(rel, dep, synonyms);
                console.error(dep);
                var i = externalDeps.indexOf(dep);
                if (i !== -1) return "d" + i;
                if (typeof modulesMap[dep].factory !== 'function')
                    return "factories['" + dep + "']";
                return "factories['" + dep + "'](" +
                    makeDepsInjectionString(dep, modulesMap[dep].deps) + ")";
            });
            return res.join(',');
        }
    }

    function normalizeDep(rel, dep, synonyms){
        // extract plugin prefix
        var parts = dep.match(/(^.+?!)?(.+$)/),
            plugin = parts[1],
            depPath = parts[2];

        depPath = synonyms[depPath] || depPath;

        if (!/^\.?\.\//.test(depPath)) return (plugin ? plugin : "") + depPath;

        depPath = depPath.replace(/^\.\//, "");
        parts = depPath.match(/^((?:\.\.\/)*)(.*)/);
        var goUpCount = parts[1].length / 3,
            name = parts[2];

        var path = rel.split('/');
        path.splice(goUpCount + 1);
        path.push(name);

        return (plugin ? plugin : "") + path.join('/');
    }
}());

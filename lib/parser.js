(function(){
    module.exports = parse;

    var esprima = require('esprima'),
        escodegen = require('escodegen');

    function parse(source){
        var tree = esprima.parse(source),
            exprs = [];
        tree.body.forEach(function(e){
            if (e.type === "ExpressionStatement"){
                if (e.expression.type === "SequenceExpression"){
                    Array.prototype.push.apply(exprs, e.expression.expressions);
                } else if (e.expression.type === "CallExpression"){
                    exprs.push(e.expression);
                }
            }
        });

        return exprs.reduce(function(p, e, i, o){
            if (
                e.type === "CallExpression" &&
                e.callee.type === "Identifier" &&
                e.callee.name === "define"
            ){
                var name = e.arguments[0].value,
                    hasDeps = e.arguments.length > 2,
                    deps = hasDeps ? e.arguments[1].elements.map(function(e){
                            return e.value;
                        }) : [],
                    factoryTree = e.arguments[hasDeps ? 2 : 1],
                    factorySource = escodegen.generate(factoryTree),
                    factory;

                eval("factory = " + factorySource);

                p.push({
                    name: name,
                    deps: deps,
                    factory: factory
                });
            }
            return p;
        }, []);
    }
}());

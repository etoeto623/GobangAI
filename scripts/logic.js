var Logic = function(){
    var _possibleWins = null;
    var _myWinsScore = null;
    var _AIWinsScore = null;

    var _defaultOpts = {
        borderSize : 15, //棋盘大小
        lineSize : 5  //连子数量
    };

    /**
     * 生成所有可能的赢法
     * 最终生成的是一个三维数组
     * wins[size][size][index]  x y index
     */
    function genAllPossibleWins(){
        var result1 = [],result2 = [],result3 = [],result4 = [];

        // 所有横向和竖向的赢法
        for(var i = 0; i < _defaultOpts.borderSize; i++){
            for( var j = _defaultOpts.lineSize-1; j < _defaultOpts.borderSize; j++ ){
                var temp1 = [],temp2 = [];
                for( var k = 0; k < _defaultOpts.borderSize; k++ ){
                    if( k>j-_defaultOpts.lineSize && k<=j ){
                        temp1.push(i);
                        temp2.push(k);
                    }
                }
                result1.push([temp1,temp2]);
                result2.push([temp2,temp1]);
            }
        }

        // 所有的斜向赢法
        for( var j = 0; j < result1.length; j+= _defaultOpts.borderSize-_defaultOpts.lineSize+1 ){
            for( var i = 0; i < _defaultOpts.borderSize-_defaultOpts.lineSize+1; i++ ){
                var y = result1[j][0][0];
                var xs = result1[j+i][1];
                var temp1 = [],temp2 = [],temp3 = [],temp4 = [];
                for( var k = 0; k < xs.length; k++ ){
                    temp1.push(xs[k]);
                    temp2.push(y+(_defaultOpts.lineSize-k)-1);

                    temp3.push(xs[k]);
                    temp4.push(y+k);
                }
                result3.push([temp1,temp2]);
                result4.push([temp3,temp4]);
            }
        }

        _possibleWins = [].concat(result1,result2,result3,result4);
    }

    /**
     * 生成赢法的赢率数组
     */
    function genWinsScore(){
        _myWinsScore = [];
        _AIWinsScore = [];
        for( var i = 0; i < _possibleWins.length; i++ ){
            _myWinsScore.push(0);
            _AIWinsScore.push(0);
        }
    }

    /**
     * 根据坐标获取该坐标所在的所有赢法的序号
     * @param x
     * @param y
     */
    function getAllWinsIndexByCoord(x,y){
        var result = [];
        for( var i = 0; i < _possibleWins.length; i++ ){
            var a0 = _possibleWins[i][0];
            var a1 = _possibleWins[i][1];
            for( var j = 0; j < a0.length; j++ ){
                if( a0[j]==x && a1[j]==y ){
                    result.push(i);
                }
            }
        }
        return result;
    }

    /**
     * 检查是否产生赢家
     * @returns {*}
     */
    function checkWin(){
        for( var i = 0; i < _myWinsScore.length; i++ ){
            if( _myWinsScore[i] == _defaultOpts.lineSize ){
                return "ME";
            }
            if( _AIWinsScore[i] == _defaultOpts.lineSize ){
                return "AI";
            }
        }
        return null;
    }

    function addMeWinChance( x, y ){
        addWinChance(x,y,"ME");
    }
    function addAIWinChance( x, y ){
        addWinChance(x,y,"AI");
    }

    /**
     * 给用户添加赢率
     * @param x
     * @param y
     * @param who
     */
    function addWinChance( x, y ,who ){
        var idxs = getAllWinsIndexByCoord(x,y);
        idxs.map(function(i){
            if( who=='ME' ){
                _myWinsScore[i]++;
                _AIWinsScore[i] = -1;
            }else if( who=='AI' ){
                _myWinsScore[i] = -1;
                _AIWinsScore[i]++;
            }
        });
    }

    function init(opts){
        _defaultOpts.extend(opts);

        genAllPossibleWins();
        genWinsScore();
    }



    function gg(arr){
        for( var i = 0; i < arr.length; i++ ){
            var a1 = arr[i][0];
            var a2 = arr[i][1];
            var str = "";
            for( var j = 0; j < a1.length; j++ ){
                str+="  "+a1[j]+","+a2[j];
            }
            console.log(str);
        }
    }

    return {
        init:init,
        wins:_possibleWins,
        checkWin:checkWin,
        addMeWinChance:function(x,y){
            addMeWinChance(x,y);
        },
        addAIWinChance:addAIWinChance
    }
}();
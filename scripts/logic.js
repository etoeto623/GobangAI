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
                        temp1.push(i+1);
                        temp2.push(k+1);
                    }
                }
                result1.push([temp1,temp2]); //vertical
                result2.push([temp2,temp1]); //horizontal
            }
        }

        // 所有的斜向赢法
        for( var j = 0; j < result1.length; j+= _defaultOpts.borderSize-_defaultOpts.lineSize+1 ){ // each row
            var y = result2[j][1][0]-1;
            if( y >= _defaultOpts.borderSize-_defaultOpts.lineSize+1 ){
                break;
            }
            for( var i = 0; i < _defaultOpts.borderSize-_defaultOpts.lineSize+1; i++ ){ // move horizontal
                var xs = result2[j+i][0];
                var temp1 = [],temp2 = [],temp3 = [],temp4 = [];
                for( var k = 0; k < xs.length; k++ ){
                    temp1.push(xs[k]);
                    temp2.push(y+(_defaultOpts.lineSize-k));

                    temp3.push(xs[k]);
                    temp4.push(y+1+k);
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
                    break;
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

    /**
     * 判断双方是否还有赢的可能
     */
    function anyWinChances(){
        for( var i = 0; i < _AIWinsScore.length; i++ ){
            if( _AIWinsScore[i] != -1 ||
                _myWinsScore[i] != -1){
                return true;
            }
        }
        return false;
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
                if( _AIWinsScore[i] > 0 || _myWinsScore[i] == -1 ){
                    _myWinsScore[i] = -1;
                }else{
                    _myWinsScore[i]++;
                }
                _AIWinsScore[i] = -1;
            }else if( who=='AI' ){
                if( _myWinsScore[i] > 0 || _AIWinsScore[i] == -1 ){
                    _AIWinsScore[i] = -1;
                }else{
                    _AIWinsScore[i]++;
                }
                _myWinsScore[i] = -1;
            }
        });
    }

    /**
     * AI部分
     * 1、防守：检查对手的赢率，如果对手的最大赢率高于自己，则进行阻断
     * 2、进攻：增加自己的赢率
     * 所以AI只做两件事情：获取对手的最大赢率和相应的赢法序号数组
     *                  获取自己的最大赢率和相应的赢法序号数组
     * 最后返回下子的坐标
     * @type {{}}
     */
    function AIChess( excludedCoords ){
        var AIWinInfo = getMostPossibleWinInfo( _AIWinsScore );
        var playerWinInfo = getMostPossibleWinInfo( _myWinsScore );
        var randIdx = null;
        if( AIWinInfo.max >= playerWinInfo.max ){ //AI的赢率高时，继续进攻
            randIdx = AIWinInfo.indexs[getRandom(AIWinInfo.indexs.length-1)];
        }else{
            randIdx = playerWinInfo.indexs[getRandom(playerWinInfo.indexs.length-1)];
        }
        return getRandomWinCoord( randIdx, excludedCoords );
    }

    /**
     * 获取当前某一玩家的最大赢率值以及相应的赢法的序号列表
     * @param winScores
     * @returns {{max: number, indexs: Array}}
     */
    function getMostPossibleWinInfo( winScores ){
        var max = -1; // 最大赢率
        var idxs = []; // 相应的赢法序号
        for( var i = 0; i < winScores.length; i++ ){
            if( winScores[i] > max ){
                idxs = [i];
                max = winScores[i];
            }else if( winScores[i] == max ){
                idxs.push( i );
            }
        }
        return {max:max, indexs:idxs};
    }

    /**
     * 判断某一用户在特定赢法中下一步棋的分值
     * @param point
     * @param winArr
     * @param user
     */
    function getScoreOfAPoint( point, winArr, user ){
        // TODO
    }

    function getRandomWinCoord( index, excludedCoords ){
        var allCoord = _possibleWins[index];
        var mx = 0;
        while( mx < 10000 ){
            var passCount = 0;
            var idx = getRandom( allCoord[0].length-1 );
            for( var i = 0; i < excludedCoords.length; i++ ){
                if( excludedCoords[i].x!=allCoord[0][idx] ||
                    excludedCoords[i].y!=allCoord[1][idx] ){
                    passCount++;
                }else{
                    var t = 0;
                }
            }
            if( passCount >= excludedCoords.length ){
                return {y:allCoord[1][idx],x:allCoord[0][idx]};
            }
            mx++;
        }
    }

    // 获取从0到max之间的一个随机数 闭区间
    function getRandom( max ){
        return Math.round(Math.random()*max);
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
        wins:function(){return _possibleWins},
        checkWin:checkWin,
        addMeWinChance:addMeWinChance,
        addAIWinChance:addAIWinChance,
        aiChess:AIChess,
        anyWinChances:anyWinChances
    }
}();
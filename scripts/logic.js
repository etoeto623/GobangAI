var Logic = function(){
    var _possibleWins = null;
    var _myWinsScore = null   //{coords:[],score:0} coords:当前连子(序号) score:当前赢率
    var _AIWinsScore = null;
    var _usedChess = [];

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
            _myWinsScore.push({coords:[],score:0});
            _AIWinsScore.push({coords:[],score:0});
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
            if( _myWinsScore[i].coords.length == _defaultOpts.lineSize ){
                return "ME";
            }
            if( _AIWinsScore[i].coords.length == _defaultOpts.lineSize ){
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
            if( _AIWinsScore[i].score != -1 ||
                _myWinsScore[i].score != -1){
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

    // 获取某一点在某种赢法中的序号(begin with 1)
    function getPointIndex(x,y,winArr){
        for( var i = 0; i < winArr[0].length; i++ ){
            if( x==winArr[0][i] && y==winArr[1][i] ){
                return i+1;
            }
        }
        return -1;
    }

    /**
     * 给用户添加赢率
     * @param x
     * @param y
     * @param who
     */
    function addWinChance( x, y ,who ){
        var idxs = getAllWinsIndexByCoord(x,y);
        _usedChess.push([x,y]);
        idxs.map(function(i){
            var jamedNum = jamedSituation( _possibleWins[i], who );
            if( who=='ME' ){
                _myWinsScore[i].coords.push(getPointIndex(x,y,_possibleWins[i]));
                if( _AIWinsScore[i].score > 0 || _myWinsScore[i].score == -1 ){
                    _myWinsScore[i].score = -1;
                }else{
                    _myWinsScore[i].score = getScoreOfAPoint({x:x,y:y},_possibleWins[i],_myWinsScore[i].coords,jamedNum);
                }
                _AIWinsScore[i].score = -1;
            }else if( who=='AI' ){
                _AIWinsScore[i].coords.push(getPointIndex(x,y,_possibleWins[i]));
                if( _myWinsScore[i].score > 0 || _AIWinsScore[i].score == -1 ){
                    _AIWinsScore[i].score = -1;
                }else{
                    _AIWinsScore[i].score = getScoreOfAPoint({x:x,y:y},_possibleWins[i],_AIWinsScore[i].coords,jamedNum);
                }
                _myWinsScore[i].score = -1;
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

        // 判断当前AI下一部棋之后的最大分值
        var aiMaxNextChess = getRandomWinCoord(AIWinInfo.indexs[getRandom(AIWinInfo.indexs.length-1)],"AI");
        var meMaxNextChess = getRandomWinCoord(playerWinInfo.indexs[getRandom(playerWinInfo.indexs.length-1)],"ME");

        var randIdx = null;
        var user = "ME";
        if( aiMaxNextChess.score >= meMaxNextChess.score ){ //AI的赢率高时，继续进攻
            return aiMaxNextChess.point;
        }
        return meMaxNextChess.point;
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
            if( winScores[i].score > max ){
                idxs = [i];
                max = winScores[i].score;
            }else if( winScores[i].score == max ){
                idxs.push( i );
            }
        }
        return {max:max, indexs:idxs};
    }

    /**
     * 判断某一用户在特定赢法中下一步棋的分值
     * @param point 下棋的点
     * @param winArr  某一个赢法数组
     * @param used 已经下过的点 
     * @param jamedNum
     */
    function getScoreOfAPoint( point, winArr, used, jamedNum ){
        var currentIndex = getPointIndex(point.x, point.y, winArr);
        var usedClone = [];
        for( var i = 0; i < used.length; i++ ){
            usedClone.push(used[i]);
        }
        if( usedClone.indexOf(currentIndex)==-1 ){
            usedClone.push(currentIndex);    
        }
        
        var score = 0;
        var weight = 2;
        var continueNum = 0;
        if( usedClone.length == _defaultOpts.lineSize ){
             return score = 1000000;
        }else{
            for( var i = 1; i <= _defaultOpts.lineSize; i++ ){
                if( usedClone.indexOf(i)>-1 ){
                    continueNum++;
                    weight *= continueNum;
                    score += weight;
                }else{
                    continueNum = 0;
                    weight = 2;
                }
            }
        }

        return Math.ceil(score/Math.pow(2,jamedNum));
    }

    /**
     * 某种赢法的被阻拦的情况
     */
    function jamedSituation( winArr, who ){
        var start = who=="AI"?0:1;
        var used = []; //[x,y]
        for( var i = start; i < _usedChess.length; i+=2 ){
            used.push( _usedChess[i] );
        }
        var endPoints = getLineEndpoints(winArr);
        var jamed = 0;
        for( var i = 0; i < endPoints.length; i++ ){
            var tp = endPoints[i];
            if( tp.x==-1 || tp.y==-1 ){
                jamed++;
            }else{
                for( var j = 0; j < used.length; j++ ){
                    if( used[j][0]==tp.x && used[j][1]==tp.y ){
                        jamed++;
                        break;
                    }
                }
            }
        }
        return jamed;
    }

    function getLineEndpoints( winArr ){
        if( winArr[0][0] == winArr[0][1] ){ // 纵向
            var temp = [].concat(winArr[1]);
            temp.sort(function(x,y){return x>y;});
            var e1 = temp[0] == 1 ? -1 : temp[0]-1;
            var e2 = temp[temp.length-1] == _defaultOpts.borderSize ? -1 : temp[temp.length-1]+1;
            return [{x:winArr[0][0], y:e1},{x:winArr[0][0], y:e2}];
        }else if( winArr[1][0] == winArr[1][1] ){ //横向
            var temp = [].concat(winArr[0]);
            temp.sort(function(x,y){return x>y;});
            var e1 = temp[0] == 1 ? -1 : temp[0]-1;
            var e2 = temp[temp.length-1] == _defaultOpts.borderSize ? -1 : temp[temp.length-1]+1;
            return [{y:winArr[1][0], x:e1},{y:winArr[1][0], x:e2}];
        }else if( winArr[0][0]+winArr[1][0] == winArr[0][1]+winArr[1][1] ){ //斜向
            var temp0 = [].concat(winArr[0]);
            var temp1 = [].concat(winArr[1]);
            temp0.sort(function(x,y){return x>y;});
            temp1.sort(function(x,y){return x<y});
            var e11,e12,e21,e22;
            if( temp1[0]==_defaultOpts.borderSize || temp0[0]==1 ){
                e11 = -1;
                e12 = -1;
            }else {
                e11 = temp0[0]-1;
                e12 = temp1[0]+1;
            }
            if( temp1[temp0.length-1]==1 || temp0[temp0.length-1]==_defaultOpts.borderSize ){
                e21 = -1;
                e22 = -1;
            }else {
                e21 = temp0[temp0.length-1]+1;
                e22 = temp1[temp0.length-1]-1;
            }
            return [{x:e11,y:e12},{x:e21,y:e22}];
        }else if(winArr[0][0]-winArr[1][0] == winArr[0][1]-winArr[1][1]){ //反斜向
            var temp0 = [].concat(winArr[0]);
            var temp1 = [].concat(winArr[1]);
            temp0.sort(function(x,y){return x>y;});
            temp1.sort(function(x,y){return x>y;});
            var e11,e12,e21,e22;
            if( temp1[0]==1 || temp0[0]==1 ){
                e11 = -1;
                e12 = -1;
            }else {
                e11 = temp0[0]-1;
                e12 = temp1[0]-1;
            }
            if( temp1[temp0.length-1]==_defaultOpts.borderSize || temp0[temp0.length-1]==_defaultOpts.borderSize ){
                e21 = -1;
                e22 = -1;
            }else {
                e21 = temp0[temp0.length-1]+1;
                e22 = temp1[temp0.length-1]+1;
            }
            return [{x:e11,y:e12},{x:e21,y:e22}];
        }
    }

    function getRandomWinCoord( index, user ){
        var allCoord = _possibleWins[index];  //赢法座标
        var winArr = user=="AI"?_AIWinsScore:_myWinsScore;
        winArr = winArr[index];
        var maxScore = -1;
        var maxPoint = {};
        var jamed = jamedSituation(allCoord, user);
        for( var j = 0; j < allCoord[0].length; j++ ){
            var idx = getPointIndex(allCoord[0][j],allCoord[1][j],allCoord);
            if( winArr.coords.indexOf(idx) == -1 && _usedChess.indexOfExt([allCoord[0][j],allCoord[1][j]]) == -1 ){
                var s = getScoreOfAPoint({x:allCoord[0][j],y:allCoord[1][j]},allCoord,winArr.coords,jamed);
                if( s > maxScore ){
                    maxScore = s;
                    maxPoint = {x:allCoord[0][j],y:allCoord[1][j]};
                }
            }
        }
        return {point:maxPoint,score:maxScore};
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
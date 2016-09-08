exports = module.exports = equityCalculator;

function equityCalculator(input) {
	var equity = {}
	$.ajax({
  		url: "/equity?hands=" + input,
  		dataType: 'json',
  		async: false,
  		success: function(data) {
  			equity = data;
  		}
	});
	return equity;
}
